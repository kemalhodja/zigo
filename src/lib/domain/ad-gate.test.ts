import { describe, expect, it } from "vitest";

import { decideAdGate } from "@/lib/domain/ad-gate";

describe("ad-gate", () => {
  it("always allows proceed in sponsor-only mode when marked ad-free", () => {
    expect(decideAdGate({ isAdFree: true })).toEqual({
      canProceed: true,
      requiresAd: false,
    });
  });

  it("still allows proceed without requiring a rewarded ad", () => {
    expect(decideAdGate({ isAdFree: false })).toEqual({
      canProceed: true,
      requiresAd: false,
    });
  });
});
