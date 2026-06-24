import { describe, expect, it } from "vitest";

import { assertModeratedOptionalText,ModerationRejectedError } from "@/lib/domain/moderation";
import {
  completeFocusSessionSchema,
  shareStudyMomentSchema,
  startFocusSessionSchema,
} from "@/lib/domain/study-moments";

describe("study-moments schemas", () => {
  it("accepts focus session start payload", () => {
    const parsed = startFocusSessionSchema.parse({
      areaId: 1,
      topicLabel: "Kesirler tekrarı",
      targetSeconds: 900,
    });
    expect(parsed.topicLabel).toBe("Kesirler tekrarı");
  });

  it("rejects topic labels that are too short", () => {
    expect(() =>
      startFocusSessionSchema.parse({
        topicLabel: "A",
      }),
    ).toThrow();
  });

  it("accepts focus completion payload", () => {
    const parsed = completeFocusSessionSchema.parse({
      sessionId: "00000000-0000-4000-8000-000000000901",
    });
    expect(parsed.sessionId).toContain("00000000");
  });

  it("accepts optional moderated study moment captions", () => {
    const parsed = shareStudyMomentSchema.parse({
      sessionId: "00000000-0000-4000-8000-000000000901",
      caption: "25 dakika odaklandım!",
    });
    expect(parsed.caption).toBe("25 dakika odaklandım!");
  });

  it("blocks profane study moment captions via moderation helper", () => {
    expect(() => assertModeratedOptionalText("bu metin aptal")).toThrow(ModerationRejectedError);
  });
});
