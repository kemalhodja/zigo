import {
  assertAiModeratedText,
  isAiModerationConfigured,
  moderateWithAi,
} from "@/lib/domain/moderation-ai";
import {
  BLOCKED_KEYWORD_CATEGORIES,
  BLOCKED_KEYWORD_TERMS,
  categoryToModerationReason,
  OBSCENITY_COMPACT_PATTERNS,
  OBSCENITY_PHRASE_TERMS,
  SUSPICIOUS_PATTERNS,
} from "@/lib/domain/moderation-keywords";
import type { UserRow } from "@/lib/supabase/database.types";

export type ModerationSignal = {
  isBlocked: boolean;
  needsReview: boolean;
  reason:
    | "profanity"
    | "bullying"
    | "self_harm"
    | "personal_info"
    | "off_platform_contact"
    | "spam"
    | "obscenity"
    | null;
  matchedTerm?: string;
};

export type ModerationPublishStatus = "pending" | "approved";

export type ModeratedPublishResult = {
  text: string;
  moderationStatus: ModerationPublishStatus;
};

export class ModerationRejectedError extends Error {
  readonly code = "MODERATION_BLOCKED";
  readonly reason: NonNullable<ModerationSignal["reason"]>;

  constructor(reason: NonNullable<ModerationSignal["reason"]>, matchedTerm?: string) {
    super(getModerationMessage(reason));
    this.name = "ModerationRejectedError";
    this.reason = reason;
    if (matchedTerm) {
      this.message = `${this.message} (${matchedTerm})`;
    }
  }
}

const BLOCKED_PATTERNS = BLOCKED_KEYWORD_TERMS.map(
  (term) => new RegExp(`\\b(${escapeRegExp(term)})\\b`, "i"),
);

export function getModerationMessage(reason: NonNullable<ModerationSignal["reason"]>) {
  switch (reason) {
    case "self_harm":
      return "Bu metin güvenlik nedeniyle kaydedilemez.";
    case "personal_info":
      return "Kişisel bilgi paylaşımı güvenlik duvarına takıldı.";
    case "off_platform_contact":
      return "Platform dışı iletişim istekleri güvenlik duvarına takıldı.";
    case "bullying":
      return "Zorbalık içeren metin kaydedilemez.";
    case "spam":
      return "Spam benzeri metin kaydedilemez.";
    case "obscenity":
      return "Müstehcen veya uygunsuz içerik kaydedilemez.";
    case "profanity":
      return "Küfür veya uygunsuz ifade kaydedilemez.";
    default:
      return "Bu metin moderasyon kontrolünden geçemedi.";
  }
}

export function getModerationSignal(text: string): ModerationSignal {
  const normalized = normalizeText(text);
  const compact = compactModerationText(normalized);

  for (const phrase of OBSCENITY_PHRASE_TERMS) {
    const pattern = new RegExp(`\\b(${escapeRegExp(phrase)})\\b`, "i");
    if (pattern.test(normalized)) {
      return {
        isBlocked: true,
        needsReview: true,
        reason: "obscenity",
        matchedTerm: phrase,
      };
    }
  }

  for (const term of BLOCKED_KEYWORD_TERMS) {
    const pattern = new RegExp(`\\b(${escapeRegExp(term)})\\b`, "i");
    if (pattern.test(normalized)) {
      const category = BLOCKED_KEYWORD_CATEGORIES[term] ?? "profanity";
      return {
        isBlocked: true,
        needsReview: true,
        reason: categoryToModerationReason(category),
        matchedTerm: term,
      };
    }
  }

  const obscenityPattern = OBSCENITY_COMPACT_PATTERNS.find(
    (pattern) => pattern.test(compact) || pattern.test(normalized),
  );
  if (obscenityPattern) {
    return {
      isBlocked: true,
      needsReview: true,
      reason: "obscenity",
    };
  }

  const blockedPattern = BLOCKED_PATTERNS.find((pattern) => pattern.test(normalized));
  if (blockedPattern) {
    return {
      isBlocked: true,
      needsReview: true,
      reason: inferReason(normalized),
    };
  }

  const suspiciousPattern = SUSPICIOUS_PATTERNS.find((pattern) => pattern.test(normalized));

  return {
    isBlocked: false,
    needsReview: Boolean(suspiciousPattern),
    reason: suspiciousPattern ? inferReason(normalized) : null,
  };
}

export function assertModeratedText(text: string) {
  const normalized = text.trim();

  if (!normalized) {
    throw new Error("Text cannot be empty.");
  }

  const signal = getModerationSignal(normalized);

  if (signal.isBlocked) {
    throw new ModerationRejectedError(signal.reason ?? "profanity", signal.matchedTerm);
  }

  return normalized;
}

export function assertModeratedOptionalText(text: string | null | undefined) {
  if (text == null || text.trim().length === 0) {
    return null;
  }

  return assertModeratedText(text);
}

export function assertModeratedFields(fields: Record<string, string | null | undefined>) {
  for (const [fieldName, value] of Object.entries(fields)) {
    if (value == null || value.trim().length === 0) continue;
    try {
      assertModeratedText(value);
    } catch (error) {
      if (error instanceof ModerationRejectedError) {
        throw new ModerationRejectedError(error.reason, fieldName);
      }
      throw error;
    }
  }
}

export function assertSafeStudentText(text: string) {
  return assertModeratedText(text);
}

export function resolveModerationPublishStatus(
  role: UserRow["role"],
  needsReview: boolean,
): ModerationPublishStatus {
  if (role === "student" || needsReview) {
    return "pending";
  }
  return "approved";
}

/** Keyword + optional AI gate for comments/replies that may enter the human review queue. */
export async function moderateTextForPublish(
  text: string,
  role: UserRow["role"],
): Promise<ModeratedPublishResult> {
  const normalized = assertModeratedText(text);
  const signal = getModerationSignal(normalized);
  let needsReview = signal.needsReview;

  if (isAiModerationConfigured()) {
    try {
      const verdict = await moderateWithAi(normalized);
      if (verdict) {
        if (!verdict.safe) {
          throw new ModerationRejectedError(inferReason(normalized) ?? "profanity", verdict.reason);
        }
        if (verdict.needsReview) {
          needsReview = true;
        }
      }
    } catch (error) {
      if (error instanceof ModerationRejectedError) throw error;
      throw new ModerationRejectedError("profanity");
    }
  }

  return {
    text: normalized,
    moderationStatus: resolveModerationPublishStatus(role, needsReview),
  };
}

/** Keyword gate first, then optional AI provider when configured. */
export async function assertModeratedTextAsync(text: string) {
  const normalized = assertModeratedText(text);
  if (!isAiModerationConfigured()) return normalized;
  try {
    return await assertAiModeratedText(normalized);
  } catch (error) {
    if (error instanceof ModerationRejectedError) throw error;
    throw new ModerationRejectedError("profanity");
  }
}

export async function assertModeratedOptionalTextAsync(text: string | null | undefined) {
  if (text == null || text.trim().length === 0) {
    return null;
  }

  return assertModeratedTextAsync(text);
}

export async function assertModeratedFieldsAsync(fields: Record<string, string | null | undefined>) {
  for (const [fieldName, value] of Object.entries(fields)) {
    if (value == null || value.trim().length === 0) continue;
    try {
      await assertModeratedTextAsync(value);
    } catch (error) {
      if (error instanceof ModerationRejectedError) {
        throw new ModerationRejectedError(error.reason, fieldName);
      }
      throw error;
    }
  }
}

export async function assertSafeStudentTextAsync(text: string) {
  return assertModeratedTextAsync(text);
}

export function isModerationRejectedError(error: unknown): error is ModerationRejectedError {
  return error instanceof ModerationRejectedError;
}

function normalizeText(text: string) {
  return text
    .toLocaleLowerCase("tr")
    .replaceAll("ı", "i")
    .replaceAll("İ", "i")
    .replaceAll("1", "i")
    .replaceAll("!", "i")
    .replaceAll("3", "e")
    .replaceAll("4", "a")
    .replaceAll("@", "a")
    .replaceAll("0", "o")
    .replaceAll("$", "s")
    .replace(/\s+/g, " ")
    .trim();
}

function compactModerationText(normalized: string) {
  return normalized.replace(/[^a-z0-9]/g, "");
}

function inferReason(text: string): ModerationSignal["reason"] {
  if (/\b(kendini oldur|kendini öldür|geber|olsen iyi|ölsen iyi)\b/i.test(text)) return "self_harm";
  if (/\b(adresim|telefonum|okulum|evim)\b/i.test(text)) return "personal_info";
  if (/\b(whatsapp|telegram|snap|discord|dm|mesaj at|özelden)\b/i.test(text)) return "off_platform_contact";
  if (/(.)\1{5,}/i.test(text)) return "spam";
  if (/\b(zorbalik|zorbalık|dalga geç|disla|dışla|ezik)\b/i.test(text)) return "bullying";
  if (
    /\b(müstehcen|mustehcen|porno|pornografi|çıplak|ciplak|erotik|nsfw|hentai|xxx|nude|sikiş|sikis)\b/i.test(
      text,
    )
  ) {
    return "obscenity";
  }
  return "profanity";
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
