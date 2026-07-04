import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import type { SubscriptionTier } from "@/lib/supabase/database.types";

export type UserSubscription = {
  tier: SubscriptionTier;
  isPremium: boolean;
};

export async function getUserSubscription(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<UserSubscription> {
  const { data, error } = await supabase
    .from("user_subscriptions")
    .select("tier, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  const tier = (data?.tier ?? "free") as SubscriptionTier;
  const periodEnd = data?.current_period_end ? new Date(data.current_period_end) : null;
  const isActivePremium = tier === "zigo_plus" && (!periodEnd || periodEnd.getTime() > Date.now());

  return {
    tier: isActivePremium ? "zigo_plus" : "free",
    isPremium: isActivePremium,
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
