import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import type { SubscriptionTier } from "@/lib/supabase/database.types";

export type UserSubscription = {
  tier: SubscriptionTier;
  isPremium: boolean;
  isPaidPremium: boolean;
  isTrialActive: boolean;
  trialEndsAt: Date | null;
  trialDaysLeft: number;
  trialExpired: boolean;
};

export async function getUserSubscription(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<UserSubscription> {
  const { data, error } = await supabase
    .from("user_subscriptions")
    .select("tier, current_period_end, trial_started_at, trial_ends_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  const tier = (data?.tier ?? "free") as SubscriptionTier;
  const periodEnd = data?.current_period_end ? new Date(data.current_period_end) : null;
  const trialEndsAt = data?.trial_ends_at ? new Date(data.trial_ends_at) : null;
  const isPaidPremium = tier === "zigo_plus" && (!periodEnd || periodEnd.getTime() > Date.now());
  const isTrialActive = Boolean(trialEndsAt && trialEndsAt.getTime() > Date.now());
  const isPremium = isPaidPremium || isTrialActive;
  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : 0;
  const trialExpired = Boolean(trialEndsAt && trialEndsAt.getTime() <= Date.now());

  return {
    tier: isPremium ? "zigo_plus" : "free",
    isPremium,
    isPaidPremium,
    isTrialActive,
    trialEndsAt,
    trialDaysLeft,
    trialExpired,
  };
}

export function canAccessAdvancedAnalytics(subscription: UserSubscription) {
  return subscription.isPremium;
}

export function canAccessCustomStudyPlans(subscription: UserSubscription) {
  return subscription.isPremium;
}

export function isAdFreeExperience(subscription: UserSubscription) {
  return subscription.isPremium;
}

export function canAccessPremiumPrepLinks(
  subscription: UserSubscription,
  role: "student" | "parent" | "teacher" | null | undefined,
) {
  return subscription.isPremium && (role === "student" || role === "parent");
}
