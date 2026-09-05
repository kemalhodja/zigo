import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import type { SubscriptionTier } from "@/lib/supabase/database.types";

export type UserSubscription = {
  tier: SubscriptionTier;
  isPremium: boolean;
  isTrial?: boolean;
  trialDaysRemaining?: number;
};

export async function getUserSubscription(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<UserSubscription> {
  // ── Step 1: Check paid subscription ──────────────────────────────────────
  let isActivePaidPremium = false;
  try {
    const { data, error } = await supabase
      .from("user_subscriptions")
      .select("tier, current_period_end")
      .eq("user_id", userId)
      .maybeSingle();

    if (!error && data) {
      const tier = (data.tier ?? "free") as SubscriptionTier;
      const periodEnd = data.current_period_end ? new Date(data.current_period_end) : null;
      isActivePaidPremium = tier === "zigo_plus" && (!periodEnd || periodEnd.getTime() > Date.now());

      if (isActivePaidPremium) {
        return {
          tier: "zigo_plus",
          isPremium: true,
          isTrial: false,
          trialDaysRemaining: 0,
        };
      }
    }
  } catch {
    // RLS or network error — fall through to trial check
  }

  // ── Step 2: Check 7-day trial via users.created_at ───────────────────────
  let isTrialActive = false;
  let trialDaysRemaining = 0;
  try {
    const { data: user } = await supabase
      .from("users")
      .select("created_at")
      .eq("id", userId)
      .maybeSingle();

    if (user?.created_at) {
      const createdTime = new Date(user.created_at).getTime();
      const diffDays = Math.floor((Date.now() - createdTime) / (1000 * 60 * 60 * 24));
      // 7-day full trial: days 0-6 inclusive (< 7)
      if (diffDays < 7) {
        isTrialActive = true;
        trialDaysRemaining = Math.max(0, 6 - diffDays);
      }
    }
  } catch {
    // Fail open — do not block user just because we can't verify trial status
  }

  const isPremium = isActivePaidPremium || isTrialActive;

  return {
    tier: isPremium ? "zigo_plus" : "free",
    isPremium,
    isTrial: isTrialActive,
    trialDaysRemaining,
  };
}

export function canAccessAdvancedAnalytics(subscription: UserSubscription) {
  return subscription.isPremium;
}

export function canAccessCustomStudyPlans(subscription: UserSubscription) {
  return subscription.isPremium;
}

