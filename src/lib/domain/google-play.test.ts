import { describe, expect, it } from "vitest";

import {
  getBillingPlatformMessage,
  isAndroidCapacitorUserAgent,
  isWebCheckoutAllowedForRequest,
} from "@/lib/domain/billing-platform";

describe("google-play billing platform", () => {
  it("detects capacitor android client", () => {
    expect(isAndroidCapacitorUserAgent("Mozilla/5.0 (Linux; Android 14) Capacitor")).toBe(true);
    expect(isAndroidCapacitorUserAgent("Mozilla/5.0 (Linux; Android 14) Chrome/120")).toBe(false);
  });

  it("returns active Google Play billing messages", () => {
    const trMessage = getBillingPlatformMessage("tr");
    const enMessage = getBillingPlatformMessage("en");

    expect(trMessage).toContain("Google Play ile ödeme aktif");
    expect(enMessage).toContain("Google Play Billing is active");
  });

  it("blocks web checkout for android capacitor clients", () => {
    const request = new Request("https://zigo.app/api/billing/checkout", {
      headers: { "user-agent": "Mozilla/5.0 (Linux; Android 14) Capacitor" },
    });
    expect(isWebCheckoutAllowedForRequest(request)).toBe(false);
  });
});
