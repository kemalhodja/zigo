import { describe, expect, it } from "vitest";

import {
  applySubscriptionCampaignPrice,
  isSubscriptionCampaignActive,
  resolveSubscriptionPlanPricing,
} from "@/lib/domain/subscription-campaign";

describe("subscription-campaign", () => {
  it("is active before 1 August 2026", () => {
    expect(isSubscriptionCampaignActive(new Date("2026-07-31T12:00:00+03:00"))).toBe(true);
    expect(isSubscriptionCampaignActive(new Date("2026-08-01T00:00:00+03:00"))).toBe(false);
  });

  it("applies 75% discount during campaign", () => {
    expect(applySubscriptionCampaignPrice(99, new Date("2026-07-01"))).toBe(25);
    expect(applySubscriptionCampaignPrice(900, new Date("2026-07-01"))).toBe(225);
    expect(applySubscriptionCampaignPrice(99, new Date("2026-08-02"))).toBe(99);
  });

  it("uses list price as compare-at during campaign", () => {
    const pricing = resolveSubscriptionPlanPricing(99, new Date("2026-07-01"));
    expect(pricing.campaignActive).toBe(true);
    expect(pricing.priceTry).toBe(25);
    expect(pricing.compareAtTry).toBe(99);
  });

  it("falls back to legacy compare-at after campaign", () => {
    const pricing = resolveSubscriptionPlanPricing(99, new Date("2026-08-02"));
    expect(pricing.campaignActive).toBe(false);
    expect(pricing.priceTry).toBe(99);
    expect(pricing.compareAtTry).toBe(297);
  });
});
