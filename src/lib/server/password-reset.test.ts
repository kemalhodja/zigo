import { describe, expect, it } from "vitest";

import {
  FORGOT_PASSWORD_ACCOUNT_NOT_FOUND,
  hasDirectRecoveryEmailConfigured,
} from "@/lib/server/password-reset";

describe("password-reset", () => {
  it("exposes account-not-found copy", () => {
    expect(FORGOT_PASSWORD_ACCOUNT_NOT_FOUND).toContain("kayıtlı hesap bulunamadı");
  });

  it("detects direct Resend delivery", () => {
    const original = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;
    expect(hasDirectRecoveryEmailConfigured()).toBe(false);
    process.env.RESEND_API_KEY = "re_test";
    expect(hasDirectRecoveryEmailConfigured()).toBe(true);
    if (original === undefined) {
      delete process.env.RESEND_API_KEY;
    } else {
      process.env.RESEND_API_KEY = original;
    }
  });
});
