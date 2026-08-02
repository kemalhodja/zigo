import { describe, expect, it } from "vitest";

import {
  adminBillingGrantSchema,
  buildAdminBillingGrantInsert,
  resolveAdminGrantDurationDays,
  resolveAdminGrantPeriodEnd,
  summarizeAdminBillingGrant,
} from "@/lib/domain/admin-billing-grant";

describe("admin-billing-grant", () => {
  const userId = "a1111111-b222-4111-8111-111111111111";
  const adminId = "b2222222-c333-4222-8222-222222222222";

  it("parses plus and sponsor grant payloads", () => {
    expect(
      adminBillingGrantSchema.parse({
        kind: "plus",
        userId,
        periodDays: 90,
        note: "WhatsApp #42",
      }).kind,
    ).toBe("plus");

    expect(
      adminBillingGrantSchema.parse({
        kind: "sponsor",
        userId,
        packageDays: 7,
      }).kind,
    ).toBe("sponsor");
  });

  it("rejects invalid grant shapes", () => {
    expect(() =>
      adminBillingGrantSchema.parse({
        kind: "plus",
        userId: "not-a-uuid",
        periodDays: 30,
      }),
    ).toThrow();

    expect(() =>
      adminBillingGrantSchema.parse({
        kind: "sponsor",
        userId,
        packageDays: 14,
      }),
    ).toThrow();
  });

  it("resolves grant period end from day count", () => {
    const from = new Date("2026-07-23T12:00:00.000Z");
    expect(resolveAdminGrantPeriodEnd(30, from)).toBe("2026-08-22T12:00:00.000Z");
    expect(resolveAdminGrantPeriodEnd(365, from)).toBe("2027-07-23T12:00:00.000Z");
  });

  it("builds ledger insert payloads with note and duration", () => {
    const plus = adminBillingGrantSchema.parse({
      kind: "plus",
      userId,
      periodDays: 90,
      note: " Kurs XYZ ",
    });
    expect(resolveAdminGrantDurationDays(plus)).toBe(90);
    expect(
      buildAdminBillingGrantInsert({
        adminId,
        grant: plus,
        periodEndsAt: "2026-10-21T12:00:00.000Z",
      }),
    ).toEqual({
      admin_id: adminId,
      user_id: userId,
      kind: "plus",
      duration_days: 90,
      note: "Kurs XYZ",
      period_ends_at: "2026-10-21T12:00:00.000Z",
    });

    expect(
      summarizeAdminBillingGrant({
        kind: "sponsor",
        durationDays: 7,
        userName: "Aylin",
      }),
    ).toBe("Sponsor 7d → Aylin");
  });
});
