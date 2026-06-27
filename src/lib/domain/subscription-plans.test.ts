import { describe, expect, it } from "vitest";

import {
  applySubscriptionCampaignPrice,
  isSubscriptionCampaignActive,
} from "@/lib/domain/subscription-campaign";
import {
  formatTryPrice,
  resolveProfilePlanGroups,
} from "@/lib/domain/subscription-plans";

describe("subscription-plans", () => {
  it("formats Turkish lira prices", () => {
    expect(formatTryPrice(99)).toContain("99");
    expect(formatTryPrice(1499)).toContain("1.499");
  });

  it("uses campaign pricing before 1 August 2026", () => {
    if (!isSubscriptionCampaignActive(new Date("2026-07-01"))) return;
    const student = resolveProfilePlanGroups("student")[0];
    expect(student?.plans[0]?.priceTry).toBe(applySubscriptionCampaignPrice(99));
    expect(student?.plans[0]?.compareAtTry).toBe(99);
    expect(student?.plans[2]?.priceTry).toBe(applySubscriptionCampaignPrice(900));
    expect(student?.plans[2]?.compareAtTry).toBe(900);
  });

  it("returns teacher creator pricing", () => {
    const teacher = resolveProfilePlanGroups("teacher")[0];
    const listPrices = [199, 1000, 1499];
    if (isSubscriptionCampaignActive()) {
      expect(teacher?.plans.map((plan) => plan.priceTry)).toEqual(listPrices.map((price) => applySubscriptionCampaignPrice(price)));
      expect(teacher?.plans.map((plan) => plan.compareAtTry)).toEqual(listPrices);
    } else {
      expect(teacher?.plans.map((plan) => plan.priceTry)).toEqual(listPrices);
    }
  });

  it("offers family package for parents with linked children", () => {
    const groups = resolveProfilePlanGroups("parent", true);
    const familyPrices = [149, 700, 1200];
    expect(groups[0]?.id).toBe("family");
    if (isSubscriptionCampaignActive()) {
      expect(groups[0]?.plans.map((plan) => plan.priceTry)).toEqual(familyPrices.map((price) => applySubscriptionCampaignPrice(price)));
    } else {
      expect(groups[0]?.plans.map((plan) => plan.priceTry)).toEqual(familyPrices);
    }
    expect(groups[1]?.id).toBe("parent");
  });

  it("uses individual parent pricing without children", () => {
    const groups = resolveProfilePlanGroups("parent", false);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.id).toBe("parent");
  });

  it("returns institution org pricing for kurs and okul", () => {
    const kurs = resolveProfilePlanGroups("teacher", false, "kurs");
    expect(kurs).toHaveLength(1);
    expect(kurs[0]?.id).toBe("institution");
    const yearlyList = 5000;
    if (isSubscriptionCampaignActive()) {
      expect(kurs[0]?.plans.find((item) => item.interval === "yearly")?.priceTry).toBe(applySubscriptionCampaignPrice(yearlyList));
      expect(kurs[0]?.plans.find((item) => item.interval === "yearly")?.compareAtTry).toBe(yearlyList);
    } else {
      expect(kurs[0]?.plans.find((item) => item.interval === "yearly")?.priceTry).toBe(yearlyList);
      expect(kurs[0]?.plans.find((item) => item.interval === "yearly")?.compareAtTry).toBe(15000);
    }
  });

  it("shows only institution plans for registration institution accounts", () => {
    const groups = resolveProfilePlanGroups("teacher", false, "egitim_kurumu");
    expect(groups).toHaveLength(1);
    expect(groups[0]?.id).toBe("institution");
    expect(groups.some((group) => group.id === "teacher")).toBe(false);
  });

  it("shows only platform plans for registration platform accounts", () => {
    const groups = resolveProfilePlanGroups("teacher", false, "egitim_platformu");
    expect(groups).toHaveLength(1);
    expect(groups[0]?.id).toBe("platform");
    const yearlyList = 4000;
    if (isSubscriptionCampaignActive()) {
      expect(groups[0]?.plans.find((item) => item.interval === "yearly")?.priceTry).toBe(applySubscriptionCampaignPrice(yearlyList));
    } else {
      expect(groups[0]?.plans.find((item) => item.interval === "yearly")?.priceTry).toBe(yearlyList);
    }
  });
});
