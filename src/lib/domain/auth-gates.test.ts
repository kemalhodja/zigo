import { describe, expect, it } from "vitest";

import {
  authGateRedirectPath,
  isEmailConfirmationEnforced,
  isEmailConfirmed,
  requiresEmailConfirmation,
  roleRequiresStudentDocument,
} from "@/lib/domain/auth-gates";

describe("auth-gates", () => {
  it("detects confirmed email", () => {
    expect(isEmailConfirmed({ email_confirmed_at: "2026-01-01T00:00:00Z" })).toBe(true);
    expect(isEmailConfirmed({ email_confirmed_at: undefined })).toBe(false);
  });

  it("maps gates to verify routes", () => {
    expect(authGateRedirectPath("email")).toBe("/auth/verify-email");
    expect(authGateRedirectPath("student-document")).toBe("/auth/verify-student");
    expect(authGateRedirectPath("ready")).toBe("/");
  });

  it("requires student document only for student role", () => {
    expect(roleRequiresStudentDocument("student")).toBe(true);
    expect(roleRequiresStudentDocument("parent")).toBe(false);
    expect(roleRequiresStudentDocument("teacher")).toBe(false);
  });

  it("respects email confirmation enforcement flag", () => {
    const previous = process.env.ZIGO_REQUIRE_EMAIL_CONFIRM;
    process.env.ZIGO_REQUIRE_EMAIL_CONFIRM = "false";
    expect(isEmailConfirmationEnforced()).toBe(false);
    expect(requiresEmailConfirmation({ email_confirmed_at: undefined })).toBe(false);
    process.env.ZIGO_REQUIRE_EMAIL_CONFIRM = previous;
  });
});
