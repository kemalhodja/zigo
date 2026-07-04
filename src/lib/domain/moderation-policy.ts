import type { SupabaseClient } from "@supabase/supabase-js";

import { DomainForbiddenError } from "@/lib/domain/domain-errors";
import {
  assertModeratedTextAsync,
  assertSafeStudentTextAsync,
  getModerationMessage,
  moderateTextForPublish,
  type ModerationPublishStatus,
  ModerationRejectedError,
  type ModerationSignal,
} from "@/lib/domain/moderation";
import type { Database, UserRow } from "@/lib/supabase/database.types";

export type ModerationContentKind =
  | "comment"
  | "story_reply"
  | "question"
  | "answer"
  | "social_post"
  | "story"
  | "bio"
  | "other";

export type ModerationStrikeResult = {
  action: "warned" | "restricted" | "none";
  strikeCount: number;
  restricted: boolean;
};

export class ModerationPolicyBlockedError extends ModerationRejectedError {
  readonly strikeCount: number;
  readonly restricted: boolean;
  readonly isFirstWarning: boolean;
  readonly contentKind: ModerationContentKind;

  constructor(
    reason: NonNullable<ModerationSignal["reason"]>,
    input: {
      strikeCount: number;
      restricted: boolean;
      contentKind: ModerationContentKind;
      matchedTerm?: string;
    },
  ) {
    super(reason, input.matchedTerm);
    this.strikeCount = input.strikeCount;
    this.restricted = input.restricted;
    this.isFirstWarning = input.strikeCount === 1 && !input.restricted;
    this.contentKind = input.contentKind;
    this.message = buildModerationPolicyMessage(reason, input);
  }
}

const STRIKEABLE_REASONS = new Set<NonNullable<ModerationSignal["reason"]>>([
  "profanity",
  "obscenity",
  "bullying",
]);

export function isStrikeableModerationReason(
  reason: ModerationSignal["reason"],
): reason is "profanity" | "obscenity" | "bullying" {
  return reason != null && STRIKEABLE_REASONS.has(reason);
}

export async function assertUserCanPublishSocialContent(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const { data, error } = await supabase
    .from("users")
    .select("social_interactions_blocked")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;

  if (data?.social_interactions_blocked) {
    throw new DomainForbiddenError(
      "Paylaşım ve yorum yapma özelliğin güvenlik nedeniyle kapatıldı. Destek ekibiyle iletişime geç.",
      "SOCIAL_INTERACTIONS_BLOCKED",
    );
  }
}

export async function recordModerationStrike(
  supabase: SupabaseClient<Database>,
  input: {
    reason: "profanity" | "obscenity" | "bullying";
    contentKind: ModerationContentKind;
    contentPreview: string;
    matchedTerm?: string;
  },
): Promise<ModerationStrikeResult> {
  const { data, error } = await supabase.rpc("record_moderation_violation", {
    p_reason: input.reason,
    p_content_kind: input.contentKind,
    p_content_preview: input.contentPreview.slice(0, 200),
    p_matched_term: input.matchedTerm ?? null,
  });

  if (error) throw error;

  const payload = (data ?? {}) as {
    action?: ModerationStrikeResult["action"];
    strike_count?: number;
    restricted?: boolean;
  };

  return {
    action: payload.action ?? "none",
    strikeCount: payload.strike_count ?? 0,
    restricted: Boolean(payload.restricted),
  };
}

export async function raiseModerationPolicyError(
  supabase: SupabaseClient<Database>,
  error: ModerationRejectedError,
  input: {
    contentKind: ModerationContentKind;
    contentPreview: string;
  },
): Promise<ModerationPolicyBlockedError> {
  if (!isStrikeableModerationReason(error.reason)) {
    throw error;
  }

  const strike = await recordModerationStrike(supabase, {
    reason: error.reason,
    contentKind: input.contentKind,
    contentPreview: input.contentPreview,
    matchedTerm: extractMatchedTerm(error),
  });

  return new ModerationPolicyBlockedError(error.reason, {
    strikeCount: strike.strikeCount,
    restricted: strike.restricted,
    contentKind: input.contentKind,
    matchedTerm: extractMatchedTerm(error),
  });
}

export async function runModeratedPublishAction<T>(
  supabase: SupabaseClient<Database>,
  input: {
    userId: string;
    userRole: UserRow["role"];
    contentKind: ModerationContentKind;
    text: string;
  },
  action: (moderated: { text: string; moderationStatus: ModerationPublishStatus }) => Promise<T>,
): Promise<T> {
  await assertUserCanPublishSocialContent(supabase, input.userId);

  try {
    const moderated = await moderateTextForPublish(input.text, input.userRole);
    return await action(moderated);
  } catch (error) {
    if (error instanceof ModerationRejectedError) {
      throw await raiseModerationPolicyError(supabase, error, {
        contentKind: input.contentKind,
        contentPreview: input.text,
      });
    }
    throw error;
  }
}

export async function runModeratedSafeTextAction<T>(
  supabase: SupabaseClient<Database>,
  input: {
    userId: string;
    contentKind: ModerationContentKind;
    text: string;
  },
  action: (text: string) => Promise<T>,
): Promise<T> {
  await assertUserCanPublishSocialContent(supabase, input.userId);

  try {
    const text = await assertSafeStudentTextAsync(input.text);
    return await action(text);
  } catch (error) {
    if (error instanceof ModerationRejectedError) {
      throw await raiseModerationPolicyError(supabase, error, {
        contentKind: input.contentKind,
        contentPreview: input.text,
      });
    }
    throw error;
  }
}

export async function runModeratedFieldsAction<T>(
  supabase: SupabaseClient<Database>,
  input: {
    userId: string;
    contentKind: ModerationContentKind;
    fields: Array<{ label: string; text: string }>;
  },
  action: (values: string[]) => Promise<T>,
): Promise<T> {
  await assertUserCanPublishSocialContent(supabase, input.userId);

  const values: string[] = [];

  for (const field of input.fields) {
    try {
      values.push(await assertSafeStudentTextAsync(field.text));
    } catch (error) {
      if (error instanceof ModerationRejectedError) {
        throw await raiseModerationPolicyError(supabase, error, {
          contentKind: input.contentKind,
          contentPreview: field.text,
        });
      }
      throw error;
    }
  }

  return action(values);
}

export async function runModeratedOptionalTextAction<T>(
  supabase: SupabaseClient<Database>,
  input: {
    userId: string;
    contentKind: ModerationContentKind;
    text?: string | null;
  },
  action: (text: string | null) => Promise<T>,
): Promise<T> {
  await assertUserCanPublishSocialContent(supabase, input.userId);

  if (input.text == null || input.text.trim().length === 0) {
    return action(null);
  }

  try {
    const text = await assertModeratedTextAsync(input.text);
    return await action(text);
  } catch (error) {
    if (error instanceof ModerationRejectedError) {
      throw await raiseModerationPolicyError(supabase, error, {
        contentKind: input.contentKind,
        contentPreview: input.text,
      });
    }
    throw error;
  }
}

function buildModerationPolicyMessage(
  reason: NonNullable<ModerationSignal["reason"]>,
  input: { strikeCount: number; restricted: boolean },
) {
  const base = getModerationMessage(reason);

  if (input.restricted) {
    return `${base} Tekrarlayan ihlal nedeniyle paylaşım ve yorum özelliğin kapatıldı.`;
  }

  if (input.strikeCount === 1) {
    return `${base} Bu ilk uyarın. Bir daha uygunsuz içerik denersen paylaşım ve yorum yapamazsın.`;
  }

  return base;
}

function extractMatchedTerm(error: ModerationRejectedError) {
  const match = /\(([^)]+)\)\s*$/.exec(error.message);
  return match?.[1];
}

export function isModerationPolicyBlockedError(
  error: unknown,
): error is ModerationPolicyBlockedError {
  return error instanceof ModerationPolicyBlockedError;
}
