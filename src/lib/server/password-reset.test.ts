import { describe, expect, it } from "vitest";

import {
  FORGOT_PASSWORD_ACCOUNT_NOT_FOUND,
  hasDirectRecoveryEmailConfigured,
  resolveRecoverySiteUrl,
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

  it("resolves production site URL ignoring local/capacitor request origins", () => {
    const originalSite = process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_SITE_URL = "https://www.zigo.com.tr";

    expect(resolveRecoverySiteUrl("http://localhost:3000")).toBe("https://www.zigo.com.tr");
    expect(resolveRecoverySiteUrl("capacitor://localhost")).toBe("https://www.zigo.com.tr");
    expect(resolveRecoverySiteUrl()).toBe("https://www.zigo.com.tr");

    if (originalSite === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = originalSite;
    }
  });
});
