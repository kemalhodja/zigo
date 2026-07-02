import { describe, expect, it } from "vitest";

import { SubscriptionRequiredError } from "@/lib/domain/domain-errors";
import {
  assertTeacherCreatorPlus,
  canTeacherUseCreatorPlusTools,
  socialPostRequiresTeacherCreatorPlus,
} from "@/lib/domain/teacher-creator-plus";

import type { UserSubscription } from "@/lib/domain/subscription";

const plusSubscription: UserSubscription = {
  tier: "zigo_plus",
  isPremium: true,
  isPaidPremium: true,
  isTrialActive: false,
  trialEndsAt: null,
  trialDaysLeft: 0,
  trialExpired: false,
};

const freeSubscription: UserSubscription = {
  tier: "free",
  isPremium: false,
  isPaidPremium: false,
  isTrialActive: false,
  trialEndsAt: null,
  trialDaysLeft: 0,
  trialExpired: false,
};

describe("teacher-creator-plus", () => {
  it("allows verified teachers with active plus", () => {
    expect(canTeacherUseCreatorPlusTools(plusSubscription, "teacher")).toBe(true);
  });

  it("blocks free teachers from creator tools", () => {
    expect(canTeacherUseCreatorPlusTools(freeSubscription, "teacher")).toBe(false);
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
      assertTeacherCreatorPlus(freeSubscription, "teacher", "mini quiz"),
    ).toThrow(SubscriptionRequiredError);
  });
});
