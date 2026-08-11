import { describe, expect, it, vi } from "vitest";

import { adminUpdateSubscriptionTier, adminUpdateSubscriptionTierSchema } from "@/lib/domain/admin";
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

  it("accepts admin subscription tier updates for free and zigo_plus", () => {
    expect(adminUpdateSubscriptionTierSchema.parse({ userId, tier: "free" })).toEqual({ userId, tier: "free" });
    expect(adminUpdateSubscriptionTierSchema.parse({ userId, tier: "zigo_plus" })).toEqual({ userId, tier: "zigo_plus" });
    expect(() => adminUpdateSubscriptionTierSchema.parse({ userId, tier: "invalid" })).toThrow();
  });

  it("requires platform admin rights before mutating subscription tiers", async () => {
    const forbiddenSupabase = {
      rpc: vi.fn().mockResolvedValue({ data: false, error: null }),
    } as unknown as Parameters<typeof adminUpdateSubscriptionTier>[0];

    await expect(
      adminUpdateSubscriptionTier(forbiddenSupabase, { userId, tier: "zigo_plus" }),
    ).rejects.toThrow("Platform admin access is required.");
  });

  it("applies tier updates when the caller is a platform admin", async () => {
    const allowedSupabase = {
      rpc: vi.fn((method: string) => {
        if (method === "current_user_is_platform_admin") {
          return Promise.resolve({ data: true, error: null });
        }

        if (method === "set_user_subscription_tier") {
          return Promise.resolve({ data: { ok: true }, error: null });
        }

        return Promise.resolve({ data: null, error: null });
      }),
    } as unknown as Parameters<typeof adminUpdateSubscriptionTier>[0];

    await expect(
      adminUpdateSubscriptionTier(allowedSupabase, { userId, tier: "free" }),
    ).resolves.toBeUndefined();
    expect(allowedSupabase.rpc).toHaveBeenCalledWith("current_user_is_platform_admin");
    expect(allowedSupabase.rpc).toHaveBeenCalledWith("set_user_subscription_tier", {
      p_user_id: userId,
      p_tier: "free",
    });
  });
});
