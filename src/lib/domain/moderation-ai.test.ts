import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  assertAiModeratedText,
  isAiModerationConfigured,
  moderateWithAi,
} from "@/lib/domain/moderation-ai";

describe("moderation-ai", () => {
  const previousUrl = process.env.ZIGO_AI_MODERATION_URL;
  const previousKey = process.env.ZIGO_AI_MODERATION_KEY;
  const previousTimeout = process.env.ZIGO_AI_MODERATION_TIMEOUT_MS;

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    if (previousUrl === undefined) delete process.env.ZIGO_AI_MODERATION_URL;
    else process.env.ZIGO_AI_MODERATION_URL = previousUrl;
    if (previousKey === undefined) delete process.env.ZIGO_AI_MODERATION_KEY;
    else process.env.ZIGO_AI_MODERATION_KEY = previousKey;
    if (previousTimeout === undefined) delete process.env.ZIGO_AI_MODERATION_TIMEOUT_MS;
    else process.env.ZIGO_AI_MODERATION_TIMEOUT_MS = previousTimeout;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("reports disabled when env URL is missing", () => {
    delete process.env.ZIGO_AI_MODERATION_URL;
    expect(isAiModerationConfigured()).toBe(false);
  });

  it("reports enabled when env URL is set", () => {
    process.env.ZIGO_AI_MODERATION_URL = "https://moderation.example/check";
    expect(isAiModerationConfigured()).toBe(true);
  });

  it("returns null when AI moderation is not configured", async () => {
    delete process.env.ZIGO_AI_MODERATION_URL;
    await expect(moderateWithAi("Güvenli metin")).resolves.toBeNull();
  });

  it("returns safe verdict from provider", async () => {
    process.env.ZIGO_AI_MODERATION_URL = "https://moderation.example/check";
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ safe: true, provider: "test" }), { status: 200 }),
    );

    await expect(moderateWithAi("Güvenli metin")).resolves.toEqual(
      expect.objectContaining({ safe: true, provider: "test", needsReview: false }),
    );
  });

  it("returns needsReview without blocking safe text", async () => {
    process.env.ZIGO_AI_MODERATION_URL = "https://moderation.example/check";
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ safe: true, needsReview: true, provider: "test" }), {
        status: 200,
      }),
    );

    await expect(moderateWithAi("Belirsiz metin")).resolves.toEqual(
      expect.objectContaining({ safe: true, needsReview: true }),
    );
  });

  it("throws when provider returns non-OK HTTP status", async () => {
    process.env.ZIGO_AI_MODERATION_URL = "https://moderation.example/check";
    vi.mocked(fetch).mockResolvedValue(new Response("bad", { status: 503 }));

    await expect(moderateWithAi("Metin")).rejects.toThrow("HTTP 503");
  });

  it("blocks unsafe AI verdicts in assertAiModeratedText", async () => {
    process.env.ZIGO_AI_MODERATION_URL = "https://moderation.example/check";
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ safe: false, reason: "bullying" }), { status: 200 }),
    );

    await expect(assertAiModeratedText("Riskli metin")).rejects.toThrow("bullying");
  });

  it("passes safe text through assertAiModeratedText", async () => {
    process.env.ZIGO_AI_MODERATION_URL = "https://moderation.example/check";
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ safe: true }), { status: 200 }),
    );

    await expect(assertAiModeratedText("Güvenli metin")).resolves.toBe("Güvenli metin");
  });

  it("propagates fetch failures to callers", async () => {
    process.env.ZIGO_AI_MODERATION_URL = "https://moderation.example/check";
    vi.mocked(fetch).mockRejectedValue(new Error("network timeout"));

    await expect(moderateWithAi("Metin")).rejects.toThrow("network timeout");
  });
});
