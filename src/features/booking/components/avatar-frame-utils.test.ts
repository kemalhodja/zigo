import { describe, expect, it } from "vitest";

import {
  getAvatarFrameAccent,
  hasLiveLessonStarBadge,
  parseChildAvatarAssets,
} from "@/features/booking/components/avatar-frame-utils";

describe("avatar frame utils", () => {
  it("detects lesson_star frame and achievement flag", () => {
    expect(
      hasLiveLessonStarBadge({
        hat: null,
        suit: null,
        pet: null,
        frame: "lesson_star",
        achievement_live_lesson: true,
      }),
    ).toBe(true);
  });

  it("uses amber accent for lesson_star frame", () => {
    expect(getAvatarFrameAccent("lesson_star")).toContain("amber");
    expect(getAvatarFrameAccent(null)).toContain("crystal");
  });

  it("normalizes child avatar assets", () => {
    expect(parseChildAvatarAssets(null)).toEqual({
      hat: null,
      suit: null,
      pet: null,
      cape: null,
      frame: null,
      achievement_live_lesson: false,
    });
  });
});
