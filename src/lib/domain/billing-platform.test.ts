import { describe, expect, it } from "vitest";

import {
  getBillingPlatformMessage,
  isAndroidCapacitorUserAgent,
  isWebCheckoutAllowedForRequest,
} from "@/lib/domain/billing-platform";

describe("billing-platform", () => {
  it("detects Capacitor Android user agents", () => {
    expect(isAndroidCapacitorUserAgent("Mozilla/5.0 (Linux; Android 14) Capacitor Zigo")).toBe(true);
    expect(isAndroidCapacitorUserAgent("Mozilla/5.0 (Linux; Android 14) Chrome/120")).toBe(false);
  });

  it("allows web checkout on all platforms including Android", () => {
    const request = new Request("https://zigo.app/api/billing/checkout", {
      headers: { "user-agent": "Mozilla/5.0 (Linux; Android 14) Capacitor" },
    });
    expect(isWebCheckoutAllowedForRequest(request)).toBe(true);
  });

  it("returns Turkish Play billing guidance", () => {
    expect(getBillingPlatformMessage("tr")).toContain("Google Play");
  });
});
