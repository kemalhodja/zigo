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
 * Kritik: user_subscriptions ve users tablolarını RLS'yi devre dışı bırakan
 * Admin (Service Role) istemciyle okur. RLS politikaları bazen sessizce
 * data: null döndürür (hata fırlatmaz) ve isPremium yanlışlıkla false olur.
 * Admin client bu sorunu köklü olarak çözer.
 *
 * Eğer admin env yoksa (geliştirme/preview), normal supabase client'a düşer.
 */
export async function getUserSubscription(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<UserSubscription> {
  // Admin client: RLS'yi tamamen bypass eder — abonelik hiçbir zaman yanlış okunmaz.
  const db = createAdminClient() ?? supabase;

  // ── Step 1: Paid subscription kontrolü ───────────────────────────────────
  try {
    const { data, error } = await db
      .from("user_subscriptions")
      .select("tier, current_period_end")
      .eq("user_id", userId)
      .maybeSingle();

    if (!error && data) {
      const tier = (data.tier ?? "free") as SubscriptionTier;
      const periodEnd = data.current_period_end ? new Date(data.current_period_end) : null;
      const isActivePaidPremium =
        tier === "zigo_plus" && (!periodEnd || periodEnd.getTime() > Date.now());

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
    // DB veya ağ hatası — trial kontrolüne geç
  }

  // ── Step 2: 7 Günlük Ücretsiz Trial kontrolü ─────────────────────────────
  let isTrialActive = false;
  let trialDaysRemaining = 0;
  try {
    const { data: user } = await db
      .from("users")
      .select("created_at")
      .eq("id", userId)
      .maybeSingle();

    if (user?.created_at) {
      const diffDays = Math.floor(
        (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24),
      );
      // 7 günlük trial: kayıt gününden itibaren 0-6. gün (< 7)
      if (diffDays < 7) {
        isTrialActive = true;
        trialDaysRemaining = Math.max(0, 6 - diffDays);
      }
    }
  } catch {
    // Fail-open: trial durumu okunamazsa kullanıcıyı bloklama
  }

  // Step 1'de isPremium bulunduysa zaten döndük. Buraya geldiysek ödeme yoktu.
  const isPremium = isTrialActive;

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

