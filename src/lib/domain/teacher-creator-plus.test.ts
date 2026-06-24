import { describe, expect, it } from "vitest";

import { SubscriptionRequiredError } from "@/lib/domain/domain-errors";
import {
  assertTeacherCreatorPlus,
  canTeacherUseCreatorPlusTools,
  socialPostRequiresTeacherCreatorPlus,
} from "@/lib/domain/teacher-creator-plus";

describe("teacher-creator-plus", () => {
  it("allows verified teachers with active plus", () => {
    expect(canTeacherUseCreatorPlusTools({ tier: "zigo_plus", isPremium: true }, "teacher")).toBe(true);
  });

  it("blocks free teachers from creator tools", () => {
    expect(canTeacherUseCreatorPlusTools({ tier: "free", isPremium: false }, "teacher")).toBe(false);
  });

  it("detects premium prep and sponsored posts", () => {
    expect(
      socialPostRequiresTeacherCreatorPlus({
        premiumPrepLabel: "Yazılı hazırlık",
        premiumPrepUrl: "https://example.com/prep",
      }),
    ).toBe(true);
    expect(
      socialPostRequiresTeacherCreatorPlus({
        sponsoredLabel: "Sponsor",
        sponsoredTargetUrl: "https://example.com/ad",
      }),
    ).toBe(true);
    expect(socialPostRequiresTeacherCreatorPlus({ postType: "quiz" })).toBe(true);
    expect(socialPostRequiresTeacherCreatorPlus({ caption: "normal" } as never)).toBe(false);
  });

  it("throws subscription required for gated features", () => {
    expect(() =>
      assertTeacherCreatorPlus({ tier: "free", isPremium: false }, "teacher", "mini quiz"),
    ).toThrow(SubscriptionRequiredError);
  });
});
