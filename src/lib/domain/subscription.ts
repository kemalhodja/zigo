import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import type { SubscriptionTier } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/lib/supabase/admin";

export type UserSubscription = {
  tier: SubscriptionTier;
  isPremium: boolean;
  isTrial?: boolean;
  trialDaysRemaining?: number;
};

/**
 * Kullanıcının abonelik durumunu döndürür.
 *
 * ÜÇ KAYNAĞI birden kontrol eder — herhangi biri true ise isPremium=true:
 *  1. user_subscriptions.tier = 'zigo_plus' (Stripe / Google Play / Apple IAP webhook)
 *  2. users.is_premium = true (admin grant / mobil satın alma fallback)
 *  3. 7 günlük kayıt denemesi (users.created_at < 7 gün önce)
 *
 * Admin (Service Role) client kullanır — RLS hiçbir zaman aboneliği gizleyemez.
 */
export async function getUserSubscription(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<UserSubscription> {
  // Admin client: RLS'yi tamamen bypass eder.
  const db = createAdminClient() ?? supabase;

  // ── Kaynak 1: user_subscriptions tablosu ─────────────────────────────────
  try {
    const { data } = await db
      .from("user_subscriptions")
      .select("tier, current_period_end")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      const tier = (data.tier ?? "free") as SubscriptionTier;
      const periodEnd = data.current_period_end ? new Date(data.current_period_end) : null;
      const isActive = tier === "zigo_plus" && (!periodEnd || periodEnd.getTime() > Date.now());

      if (isActive) {
        return { tier: "zigo_plus", isPremium: true, isTrial: false, trialDaysRemaining: 0 };
      }
    }
  } catch {
    // Hata varsa diğer kaynaklara geç
  }

  // ── Kaynak 2 + Trial: users tablosu (is_premium & created_at) ────────────
  try {
    const { data: user } = await db
      .from("users")
      .select("is_premium, created_at")
      .eq("id", userId)
      .maybeSingle();

    // users.is_premium = true → admin grant veya mobil IAP fallback
    if (user?.is_premium === true) {
      return { tier: "zigo_plus", isPremium: true, isTrial: false, trialDaysRemaining: 0 };
    }

    // 7 günlük kayıt denemesi
    if (user?.created_at) {
      const diffDays = Math.floor(
        (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diffDays < 7) {
        const trialDaysRemaining = Math.max(0, 6 - diffDays);
        return {
          tier: "zigo_plus",
          isPremium: true,
          isTrial: true,
          trialDaysRemaining,
        };
      }
    }
  } catch {
    // Fail-open: okunamazsa kullanıcıyı bloklama
  }

  return { tier: "free", isPremium: false, isTrial: false, trialDaysRemaining: 0 };
}

export function canAccessAdvancedAnalytics(subscription: UserSubscription) {
  return subscription.isPremium;
}

export function canAccessCustomStudyPlans(subscription: UserSubscription) {
  return subscription.isPremium;
}

