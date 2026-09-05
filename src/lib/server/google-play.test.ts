import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { DEFAULT_GOOGLE_PLAY_PACKAGE_NAME, verifyGooglePlaySubscription } from "./google-play";

describe("server-side google-play verification", () => {
  const originalEnv = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT;

  beforeEach(() => {
    delete process.env.GOOGLE_PLAY_SERVICE_ACCOUNT;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.GOOGLE_PLAY_SERVICE_ACCOUNT = originalEnv;
    } else {
      delete process.env.GOOGLE_PLAY_SERVICE_ACCOUNT;
    }
  });

  it("has default package name set to com.zigo.education", () => {
    expect(DEFAULT_GOOGLE_PLAY_PACKAGE_NAME).toBe("com.zigo.education");
  });

  it("gracefully provides sandbox/preview verification when service account is not configured", async () => {
    const result = await verifyGooglePlaySubscription("dummy_test_receipt_token", "zigo-plus-student-monthly");

    expect(result.isValid).toBe(true);
    expect(result.isTestPurchase).toBe(true);
    expect(result.productId).toBe("zigo-plus-student-monthly");
    expect(result.orderId).toContain("GPA.SANDBOX-");
    expect(typeof result.expiryTimeIso).toBe("string");
    expect(new Date(result.expiryTimeIso!).getTime()).toBeGreaterThan(Date.now());
  });

  it("throws clear error when GOOGLE_PLAY_SERVICE_ACCOUNT JSON is malformed", async () => {
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT = "not-valid-json-and-not-base64-json";

    await expect(
      verifyGooglePlaySubscription("dummy_token", "zigo_plus"),
    ).rejects.toThrow("GOOGLE_PLAY_SERVICE_ACCOUNT JSON formatı geçersiz");
  });
});
