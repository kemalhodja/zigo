export type AiModerationVerdict = {
  safe: boolean;
  /** When true with safe=true, content is stored but held in the human review queue. */
  needsReview?: boolean;
  reason?: string;
  confidence?: number;
  provider?: string;
};

export function isAiModerationConfigured() {
  return Boolean(process.env.ZIGO_AI_MODERATION_URL?.trim());
}

/**
 * Optional AI moderation layer. Returns null when not configured so callers
 * can fall back to regex/keyword moderation in `moderation.ts`.
 */
export async function moderateWithAi(text: string): Promise<AiModerationVerdict | null> {
  const endpoint = process.env.ZIGO_AI_MODERATION_URL?.trim();
  const apiKey = process.env.ZIGO_AI_MODERATION_KEY?.trim();

  if (!endpoint) return null;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({ text, locale: "tr" }),
    signal: AbortSignal.timeout(Number(process.env.ZIGO_AI_MODERATION_TIMEOUT_MS ?? 4000)),
  });

  if (!response.ok) {
    throw new Error(`AI moderation provider returned HTTP ${response.status}`);
  }

  const payload = (await response.json()) as {
    safe?: boolean;
    needsReview?: boolean;
    reason?: string;
    confidence?: number;
    provider?: string;
  };

  return {
    safe: Boolean(payload.safe),
    needsReview: Boolean(payload.needsReview),
    reason: payload.reason,
    confidence: payload.confidence,
    provider: payload.provider ?? "external",
  };
}

export async function assertAiModeratedText(text: string) {
  const normalized = text.trim();
  if (!normalized) {
    throw new Error("Text cannot be empty.");
  }

  const verdict = await moderateWithAi(normalized);
  if (!verdict) return normalized;

  if (!verdict.safe) {
    throw new Error(verdict.reason ?? "AI moderation blocked this text.");
  }

  return normalized;
}
