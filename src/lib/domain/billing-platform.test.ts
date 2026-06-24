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

  it("blocks web checkout on Capacitor Android by default", () => {
    const request = new Request("https://zigo.app/api/billing/checkout", {
      headers: { "user-agent": "Mozilla/5.0 (Linux; Android 14) Capacitor" },
    });
    expect(isWebCheckoutAllowedForRequest(request)).toBe(false);
  });

  it("allows override with ZIGO_ALLOW_WEB_CHECKOUT_ON_ANDROID", () => {
    const previous = process.env.ZIGO_ALLOW_WEB_CHECKOUT_ON_ANDROID;
    process.env.ZIGO_ALLOW_WEB_CHECKOUT_ON_ANDROID = "true";
    const request = new Request("https://zigo.app/api/billing/checkout", {
      headers: { "user-agent": "Mozilla/5.0 (Linux; Android 14) Capacitor" },
    });
    expect(isWebCheckoutAllowedForRequest(request)).toBe(true);
    process.env.ZIGO_ALLOW_WEB_CHECKOUT_ON_ANDROID = previous;
  });

  it("returns Turkish Play billing guidance", () => {
    expect(getBillingPlatformMessage("tr")).toContain("Google Play");
  });
});
