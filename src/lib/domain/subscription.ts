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
  const { data, error } = await supabase
    .from("user_subscriptions")
    .select("tier, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  const tier = (data?.tier ?? "free") as SubscriptionTier;
  const periodEnd = data?.current_period_end ? new Date(data.current_period_end) : null;
  const isActivePaidPremium = tier === "zigo_plus" && (!periodEnd || periodEnd.getTime() > Date.now());

  if (isActivePaidPremium) {
    return {
      tier: "zigo_plus",
      isPremium: true,
      isTrial: false,
      trialDaysRemaining: 0,
    };
  }

  // 30 Günlük Tam Özellikli Ücretsiz Deneme (Trial) Kontrolü
  const { data: user } = await supabase
    .from("users")
    .select("created_at")
    .eq("id", userId)
    .maybeSingle();

  let isTrialActive = false;
  let trialDaysRemaining = 0;

  if (user?.created_at) {
    const createdTime = new Date(user.created_at).getTime();
    const diffTime = Date.now() - createdTime;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 30) {
      isTrialActive = true;
      trialDaysRemaining = Math.max(0, 30 - diffDays);
    }
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

export function isAdFreeExperience(subscription: UserSubscription) {
  return subscription.isPremium;
}

export function canAccessPremiumPrepLinks(
  subscription: UserSubscription,
  role: "student" | "parent" | "teacher" | null | undefined,
) {
  return subscription.isPremium && (role === "student" || role === "parent");
}
