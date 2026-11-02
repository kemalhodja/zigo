import { describe, expect, it } from "vitest";

import {
  getBillingPlatformMessage,
  isAndroidCapacitorUserAgent,
  isWebCheckoutAllowedForRequest,
} from "@/lib/domain/billing-platform";

describe("google-play billing platform", () => {
  it("detects capacitor and native android clients", () => {
    expect(isAndroidCapacitorUserAgent("Mozilla/5.0 (Linux; Android 14) Capacitor")).toBe(true);
    expect(isAndroidCapacitorUserAgent("Mozilla/5.0 (Linux; Android 14; wv) Chrome/120")).toBe(true);
    expect(isAndroidCapacitorUserAgent("Mozilla/5.0 (Linux; Android 14) TWA")).toBe(true);
    expect(isAndroidCapacitorUserAgent("Mozilla/5.0 (Linux; Android 14) ZigoApp/1.0")).toBe(true);
    expect(isAndroidCapacitorUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120")).toBe(false);
  });

  it("returns active Google Play billing messages", () => {
    const trMessage = getBillingPlatformMessage("tr");
    const enMessage = getBillingPlatformMessage("en");

    expect(trMessage).toContain("Google Play ile ödeme aktif");
    expect(enMessage).toContain("Google Play Billing is active");
  });

  it("enforces Google Play only on Android app and allows web checkout on desktop/web", () => {
    const androidReq = new Request("https://www.zigo.com.tr/api/billing/checkout", {
      headers: { "user-agent": "Mozilla/5.0 (Linux; Android 14) Capacitor" },
    });
    expect(isWebCheckoutAllowedForRequest(androidReq)).toBe(false);

    const desktopReq = new Request("https://www.zigo.com.tr/api/billing/checkout", {
      headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120" },
    });
    expect(isWebCheckoutAllowedForRequest(desktopReq)).toBe(true);
  });
});
