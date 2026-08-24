import { createHash } from "node:crypto";

import { describe, expect, it, type Mock,vi } from "vitest";

import {
  calculateAgeFromBirthYear,
  createParentalConsentRequest,
  decideParentalConsent,
  getParentalConsentStatus,
  hashConsentToken,
  isMinorBirthYear,
} from "@/lib/domain/parental-consent";

describe("isMinorBirthYear", () => {
  const fixedNow = new Date("2026-08-24T00:00:00Z");

  it("treats ages below 15 as minors", () => {
    expect(isMinorBirthYear(2014, fixedNow)).toBe(true);
    expect(isMinorBirthYear(2020, fixedNow)).toBe(true);
  });

  it("treats ages 15 and above as adults", () => {
    expect(isMinorBirthYear(2011, fixedNow)).toBe(false);
    expect(isMinorBirthYear(2000, fixedNow)).toBe(false);
  });

  it("rejects implausible years", () => {
    expect(isMinorBirthYear(1800, fixedNow)).toBe(false);
    expect(isMinorBirthYear(2027, fixedNow)).toBe(false);
    expect(isMinorBirthYear(Number.NaN, fixedNow)).toBe(false);
  });
});

describe("calculateAgeFromBirthYear", () => {
  it("computes UTC-year difference", () => {
    expect(calculateAgeFromBirthYear(2012, new Date("2026-08-24T00:00:00Z"))).toBe(14);
  });
});

describe("hashConsentToken", () => {
  it("produces a deterministic sha256 hex digest", () => {
    const expected = createHash("sha256").update("token-abc").digest("hex");
    expect(hashConsentToken("token-abc")).toBe(expected);
    expect(hashConsentToken("token-abc")).toBe(hashConsentToken("token-abc"));
    expect(hashConsentToken("other")).not.toBe(expected);
  });
});

type ChainResult = { data: unknown; error: unknown };

type ChainBuilder = Record<string, Mock> & {
  maybeSingle: Mock;
};

function makeChain(final: ChainResult): ChainBuilder {
  const builder = {} as ChainBuilder;
  for (const method of ["select", "eq", "order", "limit", "delete", "update", "insert"]) {
    builder[method] = vi.fn(() => builder);
  }
  builder.maybeSingle = vi.fn(async () => final);
  return builder;
}

function makeAdmin(handlers: Record<string, () => ChainBuilder>) {
  const from = vi.fn((table: string) => handlers[table]?.() ?? makeChain({ data: null, error: null }));
  return { from } as unknown as Parameters<typeof createParentalConsentRequest>[0] & {
    from: Mock;
  };
}

describe("createParentalConsentRequest", () => {
  it("rejects invalid parent emails", async () => {
    const admin = makeAdmin({});
    const result = await createParentalConsentRequest(admin, "user-1", "not-an-email");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("veli");
  });

  it("clears previous pending rows and stores only the token hash", async () => {
    const consentChain = makeChain({ data: null, error: null });
    const admin = makeAdmin({ parental_consents: () => consentChain });

    const result = await createParentalConsentRequest(admin, "user-1", "Parent@Example.com ");
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.parentEmail).toBe("parent@example.com");
    expect(result.token).toMatch(/^[0-9a-f]{64}$/);

    expect(consentChain.delete).toHaveBeenCalled();
    expect(consentChain.eq).toHaveBeenCalledWith("student_user_id", "user-1");
    expect((consentChain.insert.mock.calls[0]?.[0] ?? {}) as Record<string, string>).toMatchObject({
      student_user_id: "user-1",
      parent_email: "parent@example.com",
      status: "pending",
      token_hash: hashConsentToken(result.token),
    });
  });
});

describe("decideParentalConsent", () => {
  const validToken = "a".repeat(64);

  it("rejects malformed tokens without touching the database", async () => {
    const admin = makeAdmin({});
    const result = await decideParentalConsent(admin, "short-token", "approved");
    expect(result.ok).toBe(false);
    expect(admin.from).not.toHaveBeenCalled();
  });

  it("approves a pending record via its hash and reports the resulting status", async () => {
    const consentChain = makeChain({ data: { status: "approved" }, error: null });
    const admin = makeAdmin({ parental_consents: () => consentChain });

    const result = await decideParentalConsent(admin, validToken, "approved");
    expect(result.ok).toBe(true);
    expect(consentChain.update).toHaveBeenCalled();
    expect(consentChain.eq).toHaveBeenCalledWith("token_hash", hashConsentToken(validToken));
    expect(consentChain.eq).toHaveBeenCalledWith("status", "pending");
  });

  it("fails when the record is missing or already decided", async () => {
    const consentChain = makeChain({ data: null, error: null });
    const admin = makeAdmin({ parental_consents: () => consentChain });

    const result = await decideParentalConsent(admin, validToken, "rejected");
    expect(result.ok).toBe(false);
  });
});

describe("getParentalConsentStatus", () => {
  it("returns none when no records exist", async () => {
    const chain = makeChain({ data: null, error: null });
    const supabase = makeAdmin({ parental_consents: () => chain });
    const status = await getParentalConsentStatus(supabase, "user-1");
    expect(status).toBe("none");
  });

  it("returns the latest status value", async () => {
    const chain = makeChain({ data: { status: "pending" }, error: null });
    const supabase = makeAdmin({ parental_consents: () => chain });
    const status = await getParentalConsentStatus(supabase, "user-1");
    expect(status).toBe("pending");
  });
});
