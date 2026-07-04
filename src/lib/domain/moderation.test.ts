import { describe, expect, it, vi } from "vitest";

import {
  assertModeratedText,
  assertModeratedTextAsync,
  getModerationSignal,
  moderateTextForPublish,
  ModerationRejectedError,
  resolveModerationPublishStatus,
} from "@/lib/domain/moderation";
import * as moderationAi from "@/lib/domain/moderation-ai";
import { isAiModerationConfigured } from "@/lib/domain/moderation-ai";

describe("moderation", () => {
  it("allows safe educational text", () => {
    const signal = getModerationSignal("Bugün kesirler konusunu tekrar edelim.");
    expect(signal.isBlocked).toBe(false);
  });

  it("blocks profanity terms from the keyword list", () => {
    expect(() => assertModeratedText("bu metin aptal")).toThrow(ModerationRejectedError);
  });

  it("blocks obscenity and porn-related terms", () => {
    const signal = getModerationSignal("burada porno izle yaziyor");
    expect(signal.isBlocked).toBe(true);
    expect(signal.reason).toBe("obscenity");
    expect(() => assertModeratedText("müstehcen içerik")).toThrow(ModerationRejectedError);
  });

  it("blocks compact porn site evasions", () => {
    const signal = getModerationSignal("p0rnhub linki");
    expect(signal.isBlocked).toBe(true);
    expect(signal.reason).toBe("obscenity");
  });

  it("blocks off-platform contact requests", () => {
    const signal = getModerationSignal("whatsapp tan yaz bana");
    expect(signal.isBlocked).toBe(true);
    expect(signal.reason).toBe("off_platform_contact");
  });

  it("flags suspicious repetition for review without blocking", () => {
    const signal = getModerationSignal("aaaaaaaaaa");
    expect(signal.isBlocked).toBe(false);
    expect(signal.needsReview).toBe(true);
    expect(signal.reason).toBe("spam");
  });

  it("rejects empty text", () => {
    expect(() => assertModeratedText("   ")).toThrow("Text cannot be empty.");
  });

  it("async path mirrors sync when AI is disabled", async () => {
    const previous = process.env.ZIGO_AI_MODERATION_URL;
    delete process.env.ZIGO_AI_MODERATION_URL;
    expect(isAiModerationConfigured()).toBe(false);
    await expect(assertModeratedTextAsync("Bugün kesirler konusunu tekrar edelim.")).resolves.toBe(
      "Bugün kesirler konusunu tekrar edelim.",
    );
    process.env.ZIGO_AI_MODERATION_URL = previous;
  });

  it("async path delegates to AI when configured and safe", async () => {
    const previous = process.env.ZIGO_AI_MODERATION_URL;
    process.env.ZIGO_AI_MODERATION_URL = "https://moderation.example/check";
    vi.spyOn(moderationAi, "assertAiModeratedText").mockResolvedValue("Güvenli metin");

    await expect(assertModeratedTextAsync("Güvenli metin")).resolves.toBe("Güvenli metin");
    expect(moderationAi.assertAiModeratedText).toHaveBeenCalledWith("Güvenli metin");

    process.env.ZIGO_AI_MODERATION_URL = previous;
    vi.restoreAllMocks();
  });

  it("async path fail-closed when AI provider errors after keyword pass", async () => {
    const previous = process.env.ZIGO_AI_MODERATION_URL;
    process.env.ZIGO_AI_MODERATION_URL = "https://moderation.example/check";
    vi.spyOn(moderationAi, "assertAiModeratedText").mockRejectedValue(new Error("provider down"));

    await expect(assertModeratedTextAsync("Güvenli metin")).rejects.toBeInstanceOf(
      ModerationRejectedError,
    );

    process.env.ZIGO_AI_MODERATION_URL = previous;
    vi.restoreAllMocks();
  });

  it("async path still blocks keyword violations before AI", async () => {
    const previous = process.env.ZIGO_AI_MODERATION_URL;
    process.env.ZIGO_AI_MODERATION_URL = "https://moderation.example/check";
    const aiSpy = vi.spyOn(moderationAi, "assertAiModeratedText");

    await expect(assertModeratedTextAsync("bu metin aptal")).rejects.toBeInstanceOf(
      ModerationRejectedError,
    );
    expect(aiSpy).not.toHaveBeenCalled();

    process.env.ZIGO_AI_MODERATION_URL = previous;
    vi.restoreAllMocks();
  });

  it("resolveModerationPublishStatus keeps students and review flags pending", () => {
    expect(resolveModerationPublishStatus("student", false)).toBe("pending");
    expect(resolveModerationPublishStatus("teacher", true)).toBe("pending");
    expect(resolveModerationPublishStatus("teacher", false)).toBe("approved");
  });

  it("moderateTextForPublish queues suspicious teacher text for review", async () => {
    const previous = process.env.ZIGO_AI_MODERATION_URL;
    delete process.env.ZIGO_AI_MODERATION_URL;

    const result = await moderateTextForPublish("hellooooooo", "teacher");
    expect(result.moderationStatus).toBe("pending");
    expect(result.text).toBe("hellooooooo");

    process.env.ZIGO_AI_MODERATION_URL = previous;
  });

  it("moderateTextForPublish queues AI needsReview verdicts", async () => {
    const previous = process.env.ZIGO_AI_MODERATION_URL;
    process.env.ZIGO_AI_MODERATION_URL = "https://moderation.example/check";
    vi.spyOn(moderationAi, "moderateWithAi").mockResolvedValue({
      safe: true,
      needsReview: true,
      provider: "test",
    });

    const result = await moderateTextForPublish("Belirsiz ton", "parent");
    expect(result.moderationStatus).toBe("pending");

    process.env.ZIGO_AI_MODERATION_URL = previous;
    vi.restoreAllMocks();
  });
});
