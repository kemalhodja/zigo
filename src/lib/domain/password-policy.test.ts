import { describe, expect, it } from "vitest";

import { isCommonPassword, validateRegistrationPassword } from "@/lib/domain/password-policy";

describe("password-policy", () => {
  it("rejects common passwords", () => {
    expect(isCommonPassword("password")).toBe(true);
    expect(isCommonPassword("Zigo1234")).toBe(true);
    expect(isCommonPassword("MyUniquePhrase9")).toBe(false);
  });

  it("requires at least 8 characters on registration", () => {
    expect(validateRegistrationPassword("short").ok).toBe(false);
    expect(validateRegistrationPassword("long-enough-secret").ok).toBe(true);
  });
});
