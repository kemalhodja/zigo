import { describe, expect, it, vi } from "vitest";

import { getUserSubscription } from "@/lib/domain/subscription";

describe("Subscription End-to-End Resolution Engine", () => {
  it("resolves active zigo_plus subscription from user_subscriptions", async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === "user_subscriptions") {
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  limit: () =>
                    Promise.resolve({
                      data: [
                        {
                          tier: "zigo_plus",
                          status: "active",
                          current_period_end: new Date(Date.now() + 86400000).toISOString(),
                          expires_at: null,
                        },
                      ],
                      error: null,
                    }),
                }),
              }),
            }),
          };
        }
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
        };
      }),
    } as any;

    const sub = await getUserSubscription(mockSupabase, "user-1");
    expect(sub.isPremium).toBe(true);
    expect(sub.tier).toBe("zigo_plus");
    expect(sub.isTrial).toBe(false);
  });

  it("handles multi-row user_subscriptions without failing (PGRST116 resilience)", async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === "user_subscriptions") {
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  limit: () =>
                    Promise.resolve({
                      data: [
                        {
                          tier: "zigo_plus",
                          status: "active",
                          current_period_end: new Date(Date.now() + 86400000).toISOString(),
                        },
                        {
                          tier: "free",
                          status: "expired",
                          current_period_end: new Date(Date.now() - 86400000).toISOString(),
                        },
                      ],
                      error: null,
                    }),
                }),
              }),
            }),
          };
        }
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
        };
      }),
    } as any;

    const sub = await getUserSubscription(mockSupabase, "user-multi");
    expect(sub.isPremium).toBe(true);
    expect(sub.tier).toBe("zigo_plus");
  });

  it("resolves status='active' with expires_at even when tier is null (Mobile / Google Play)", async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === "user_subscriptions") {
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  limit: () =>
                    Promise.resolve({
                      data: [
                        {
                          tier: null,
                          status: "active",
                          current_period_end: null,
                          expires_at: new Date(Date.now() + 10000000).toISOString(),
                        },
                      ],
                      error: null,
                    }),
                }),
              }),
            }),
          };
        }
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
        };
      }),
    } as any;

    const sub = await getUserSubscription(mockSupabase, "user-mobile");
    expect(sub.isPremium).toBe(true);
    expect(sub.tier).toBe("zigo_plus");
  });

  it("falls back to users.is_premium = true when user_subscriptions table has no active rows", async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === "user_subscriptions") {
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  limit: () => Promise.resolve({ data: [], error: null }),
                }),
              }),
            }),
          };
        }
        if (table === "users") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () =>
                  Promise.resolve({
                    data: {
                      is_premium: true,
                      created_at: new Date(Date.now() - 30 * 86400000).toISOString(), // 30 days ago
                    },
                    error: null,
                  }),
              }),
            }),
          };
        }
        return {};
      }),
    } as any;

    const sub = await getUserSubscription(mockSupabase, "user-admin-grant");
    expect(sub.isPremium).toBe(true);
    expect(sub.tier).toBe("zigo_plus");
    expect(sub.isTrial).toBe(false);
  });

  it("grants 7-day trial for newly registered users (< 7 days ago)", async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === "user_subscriptions") {
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  limit: () => Promise.resolve({ data: [], error: null }),
                }),
              }),
            }),
          };
        }
        if (table === "users") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () =>
                  Promise.resolve({
                    data: {
                      is_premium: false,
                      created_at: new Date(Date.now() - 2 * 86400000).toISOString(), // 2 days ago
                    },
                    error: null,
                  }),
              }),
            }),
          };
        }
        return {};
      }),
    } as any;

    const sub = await getUserSubscription(mockSupabase, "user-trial");
    expect(sub.isPremium).toBe(true);
    expect(sub.isTrial).toBe(true);
    expect(sub.tier).toBe("zigo_plus");
    expect(sub.trialDaysRemaining).toBeGreaterThanOrEqual(4);
  });

  it("returns free tier for expired users (> 7 days ago, not premium)", async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === "user_subscriptions") {
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  limit: () => Promise.resolve({ data: [], error: null }),
                }),
              }),
            }),
          };
        }
        if (table === "users") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () =>
                  Promise.resolve({
                    data: {
                      is_premium: false,
                      created_at: new Date(Date.now() - 14 * 86400000).toISOString(), // 14 days ago
                    },
                    error: null,
                  }),
              }),
            }),
          };
        }
        return {};
      }),
    } as any;

    const sub = await getUserSubscription(mockSupabase, "user-expired");
    expect(sub.isPremium).toBe(false);
    expect(sub.tier).toBe("free");
    expect(sub.isTrial).toBe(false);
  });
});
