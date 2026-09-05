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
 *  1. user_subscriptions tablosu (tier = 'zigo_plus' VEYA status = 'active' / 'trialing')
 *     - Multi-row toleranslı: Tekil satır hatası (PGRST116) vermez, son kayıtları tarar.
 *     - Hem current_period_end hem de expires_at sütunlarını kontrol eder.
 *  2. users.is_premium = true (admin grant / mobil satın alma / Stripe webhook)
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
    const { data: subs, error } = await (db.from("user_subscriptions") as unknown as {
      select: (cols: string) => {
        eq: (col: string, val: string) => {
          order: (col2: string, opts: { ascending: boolean }) => {
            limit: (n: number) => Promise<{
              data: Array<{
                tier?: string | null;
                status?: string | null;
                current_period_end?: string | null;
                expires_at?: string | null;
              }> | null;
              error: unknown;
            }>;
          };
        };
      };
    })
      .select("tier, status, current_period_end, expires_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(5);

    if (!error && Array.isArray(subs) && subs.length > 0) {
      const now = Date.now();
      const activeSub = subs.find((sub) => {
        const isPlusTier = sub.tier === "zigo_plus";
        const isActiveStatus = sub.status === "active" || sub.status === "trialing";
        if (!isPlusTier && !isActiveStatus) return false;

        const rawEnd = sub.current_period_end || sub.expires_at;
        if (!rawEnd) return true; // Süre sonu belirtilmemişse aktif sayılır
        const periodEnd = new Date(rawEnd);
        return !Number.isNaN(periodEnd.getTime()) && periodEnd.getTime() > now;
      });

      if (activeSub) {
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

    // users.is_premium = true → admin grant, mobil IAP veya webhook senkronu
    if (user?.is_premium === true) {
      return { tier: "zigo_plus", isPremium: true, isTrial: false, trialDaysRemaining: 0 };
    }

    // 7 günlük kayıt denemesi
    if (user?.created_at) {
      const createdTime = new Date(user.created_at).getTime();
      if (!Number.isNaN(createdTime)) {
        const diffDays = Math.floor((Date.now() - createdTime) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 7) {
          const trialDaysRemaining = Math.max(0, 6 - diffDays);
          return {
            tier: "zigo_plus",
            isPremium: true,
            isTrial: true,
            trialDaysRemaining,
          };
        }
      }
    }
  } catch {
    // Fail-open: okunamazsa kullanıcıyı bloklama
  }

  // ── Kaynak 3: Auth fallback (users tablosunda created_at yoksa) ───────────
  try {
    const admin = createAdminClient();
    if (admin) {
      const { data: authData } = await admin.auth.admin.getUserById(userId);
      if (authData?.user?.created_at) {
        const createdTime = new Date(authData.user.created_at).getTime();
        if (!Number.isNaN(createdTime)) {
          const diffDays = Math.floor((Date.now() - createdTime) / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays < 7) {
            const trialDaysRemaining = Math.max(0, 6 - diffDays);
            return {
              tier: "zigo_plus",
              isPremium: true,
              isTrial: true,
              trialDaysRemaining,
            };
          }
        }
      }
    }
  } catch {
    // Silent
  }

  return { tier: "free", isPremium: false, isTrial: false, trialDaysRemaining: 0 };
}

export function canAccessAdvancedAnalytics(subscription: UserSubscription) {
  return subscription.isPremium;
}

export function canAccessCustomStudyPlans(subscription: UserSubscription) {
  return subscription.isPremium;
}
