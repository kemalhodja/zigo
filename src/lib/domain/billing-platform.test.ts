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

  it("blocks web checkout on Android native app and allows it on web browsers", () => {
    const androidRequest = new Request("https://www.zigo.com.tr/api/billing/checkout", {
      headers: { "user-agent": "Mozilla/5.0 (Linux; Android 14) Capacitor" },
    });
    expect(isWebCheckoutAllowedForRequest(androidRequest)).toBe(false);

    const webRequest = new Request("https://www.zigo.com.tr/api/billing/checkout", {
      headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120" },
    });
    expect(isWebCheckoutAllowedForRequest(webRequest)).toBe(true);
  });

  it("returns Turkish Play billing guidance", () => {
    expect(getBillingPlatformMessage("tr")).toContain("Google Play");
  });
});
