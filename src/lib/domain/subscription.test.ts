import { describe, expect, it } from "vitest";

import { getUserSubscription } from "@/lib/domain/subscription";

describe("getUserSubscription trial logic", () => {
  it("treats active trial as premium access", async () => {
    const future = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
    const supabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: {
                tier: "free",
                current_period_end: null,
                trial_started_at: new Date().toISOString(),
                trial_ends_at: future,
              },
              error: null,
            }),
          }),
        }),
      }),
    };

    const subscription = await getUserSubscription(supabase as never, "user-id");
    expect(subscription.isPremium).toBe(true);
    expect(subscription.isTrialActive).toBe(true);
    expect(subscription.isPaidPremium).toBe(false);
    expect(subscription.trialDaysLeft).toBeGreaterThan(0);
  });

  it("marks expired trial as not premium", async () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const supabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: {
                tier: "free",
                current_period_end: null,
                trial_started_at: past,
                trial_ends_at: past,
              },
              error: null,
            }),
          }),
        }),
      }),
    };

    const subscription = await getUserSubscription(supabase as never, "user-id");
    expect(subscription.isPremium).toBe(false);
    expect(subscription.trialExpired).toBe(true);
  });
});
