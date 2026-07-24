import { describe, expect, it } from "vitest";

import {
  assertGooglePlayPurchasePayload,
  isAllowedGooglePlayPackageName,
  isMockGooglePlayPurchaseToken,
  resolveGooglePlayProductId,
  ZIGO_ANDROID_PACKAGE_NAME,
} from "@/lib/domain/google-play";

describe("google-play purchase guards", () => {
  it("rejects the old mock purchase tokens that auto-activated Plus", () => {
    expect(isMockGooglePlayPurchaseToken("gplay_token_abc123")).toBe(true);
    expect(isMockGooglePlayPurchaseToken("mock_purchase")).toBe(true);
    expect(isMockGooglePlayPurchaseToken("real.token.from.play.billing.system.long")).toBe(false);
  });

  it("requires the Android applicationId package name", () => {
    expect(ZIGO_ANDROID_PACKAGE_NAME).toBe("com.zigo.education");
    expect(isAllowedGooglePlayPackageName("com.zigo.education")).toBe(true);
    expect(isAllowedGooglePlayPackageName("com.zigo.app")).toBe(false);
  });

  it("maps plan ids to Play product ids", () => {
    expect(resolveGooglePlayProductId("student-monthly")).toBe("zigo_plus_student_monthly");
  });

  it("throws on mock payload used by the broken Android button", () => {
    expect(() =>
      assertGooglePlayPurchasePayload({
        planId: "student-monthly",
        productId: "zigo_plus_student_monthly",
        purchaseToken: "gplay_token_x9k2",
        packageName: "com.zigo.app",
        orderId: "GPA.1234-5678",
      }),
    ).toThrow(/MOCK_PURCHASE_TOKEN|INVALID_PACKAGE_NAME/);
  });
});
