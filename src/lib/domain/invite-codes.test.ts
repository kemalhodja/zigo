import { describe, expect, it } from "vitest";

import {
  canRedeemInvite,
  generateInviteCode,
  normalizeInviteCode,
  validateInviteCodeFormat,
} from "@/lib/domain/invite-codes";

describe("invite-codes", () => {
  it("normalizes and validates codes", () => {
    expect(normalizeInviteCode(" zi-go12 ")).toBe("ZIGO12");
    expect(validateInviteCodeFormat("ab")).toEqual({ ok: false, code: "", error: "INVALID_FORMAT" });
    expect(validateInviteCodeFormat("zigo12").ok).toBe(true);
  });

  it("generates zigo-prefixed codes", () => {
    expect(generateInviteCode("abc123")).toMatch(/^ZIGO/);
  });

  it("blocks own or exhausted codes", () => {
    expect(
      canRedeemInvite({
        ownerId: "a",
        redeemerId: "a",
        useCount: 0,
        maxUses: 10,
        isActive: true,
      }).error,
    ).toBe("OWN_CODE");
    expect(
      canRedeemInvite({
        ownerId: "a",
        redeemerId: "b",
        useCount: 10,
        maxUses: 10,
        isActive: true,
      }).error,
    ).toBe("EXHAUSTED");
  });
});
