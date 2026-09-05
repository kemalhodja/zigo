import type { SupabaseClient } from "@supabase/supabase-js";

import { isLocalDemoSupabase } from "@/lib/domain/demo-env";
import { getSiteUrl } from "@/lib/domain/deploy-config";
import { ensureStripeCampaignCoupon } from "@/lib/domain/stripe-campaign-provision";
import {
  calculateDynamicPrice,
  getSubscriptionCampaignStripeCouponId,
  isSubscriptionCampaignActive,
} from "@/lib/domain/subscription-campaign";
import { findPlanGroup, resolveStripePriceId } from "@/lib/domain/subscription-plans";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, SubscriptionTier } from "@/lib/supabase/database.types";

export function hasStripeConfigured() {
  if (process.env.STRIPE_SECRET_KEY?.trim() && process.env.STRIPE_PRICE_ID_ZIGO_PLUS?.trim()) {
    return true;
  }
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() &&
      resolveStripePriceId("zigo-plus-student-monthly"),
  );
}

export function canUseDevBillingBypass() {
  return isLocalDemoSupabase() || process.env.ZIGO_BILLING_DEV_BYPASS === "true";
}

export async function createZigoPlusCheckoutSession(
  userId: string,
  email: string,
  planId = "zigo-plus-student-monthly",
  userCreatedAt?: string | Date | null,
) {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  const priceId = resolveStripePriceId(planId);
  if (!secret || !priceId) {
    throw new Error("Stripe is not configured. Add STRIPE_SECRET_KEY and plan price IDs.");
  }

  const siteUrl = getSiteUrl();
  const cancelPath = findPlanGroup(planId, userCreatedAt)?.cancelPath ?? "/student?billing=cancelled";
  const body = new URLSearchParams({
    mode: "subscription",
    success_url: `${siteUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}${cancelPath}`,
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    client_reference_id: userId,
    customer_email: email,
    "metadata[plan_id]": planId,
  });

  const dynamicPricing = calculateDynamicPrice(100, userCreatedAt);
  const discountPercent = dynamicPricing.discountPercent;

  // Her zaman deneme süresi içindeyse %50 indirim kuponunu uygula
  // (Global kampanya bitmiş olsa bile, kullanıcının ilk 7 günü içindeyse hak kazanır)
  if (dynamicPricing.isWithinTrialWindow && dynamicPricing.trialDaysRemaining > 0) {
    try {
      await ensureStripeCampaignCoupon(secret);
    } catch {
      // Checkout can still proceed; coupon may already exist in Stripe.
    }
    const couponId = getSubscriptionCampaignStripeCouponId(50); // %50 indirim
    if (couponId) {
      body.set("discounts[0][coupon]", couponId);
      body.set("metadata[campaign_id]", "zigo-trial-50");
      body.set("metadata[auto_discount]", "true");
    }
    
    // Deneme süresi içindeyse, kalan gün kadar Stripe Trial ver
    body.set("subscription_data[trial_period_days]", dynamicPricing.trialDaysRemaining.toString());
  } else if (isSubscriptionCampaignActive()) {
    // Global kampanya aktifse standart indirim uygula
    try {
      await ensureStripeCampaignCoupon(secret);
    } catch {
      // Checkout can still proceed; coupon may already exist in Stripe.
    }
    const couponId = getSubscriptionCampaignStripeCouponId(discountPercent);
    if (couponId) {
      body.set("discounts[0][coupon]", couponId);
      body.set("metadata[campaign_id]", dynamicPricing.isWithinTrialWindow ? "zigo-trial-50" : "zigo-standard-0");
    }
    
    if (dynamicPricing.trialDaysRemaining > 0) {
      body.set("subscription_data[trial_period_days]", dynamicPricing.trialDaysRemaining.toString());
    }
  }

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const payload = (await response.json()) as { id?: string; url?: string; error?: { message?: string } };
  if (!response.ok || !payload.url) {
    throw new Error(payload.error?.message ?? "Stripe checkout could not be created.");
  }

  return payload;
}

export async function activateZigoPlus(
  supabase: SupabaseClient<Database>,
  userId: string,
  options?: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    currentPeriodEnd?: string;
  },
) {
  const db = createAdminClient() ?? supabase;
  const now = new Date();
  const periodEndIso =
    options?.currentPeriodEnd ??
    new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  // 1. Garantili update: users.is_premium = true
  try {
    await (db.from("users") as unknown as {
      update: (data: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<unknown> };
    })
      .update({ is_premium: true, updated_at: now.toISOString() })
      .eq("id", userId);
  } catch (err) {
    console.warn("activateZigoPlus users.is_premium update notice:", err);
  }

  // 2. Garantili upsert: user_subscriptions tablosu
  try {
    await (db.from("user_subscriptions") as unknown as {
      upsert: (data: Record<string, unknown>, opts: { onConflict: string }) => Promise<{ error: { message: string } | null }>;
    }).upsert(
      {
        user_id: userId,
        tier: "zigo_plus",
        status: "active",
        stripe_customer_id: options?.stripeCustomerId ?? null,
        stripe_subscription_id: options?.stripeSubscriptionId ?? null,
        current_period_end: periodEndIso,
        expires_at: periodEndIso,
        updated_at: now.toISOString(),
      },
      { onConflict: "user_id" },
    );
  } catch (err) {
    console.warn("activateZigoPlus user_subscriptions upsert notice:", err);
  }

  // 3. RPC çağrısı (varsa ve çalışırsa ek tetikleyiciler için)
  let rpcData: unknown = null;
  try {
    const { data, error } = await db.rpc("set_user_subscription_tier", {
      p_user_id: userId,
      p_tier: "zigo_plus" as SubscriptionTier,
      p_stripe_customer_id: options?.stripeCustomerId,
      p_stripe_subscription_id: options?.stripeSubscriptionId,
      p_current_period_end: periodEndIso,
    });
    if (error) {
      console.warn("activateZigoPlus RPC notice:", error.message);
    } else {
      rpcData = data;
    }
  } catch (err) {
    console.warn("activateZigoPlus RPC exception notice:", err);
  }

  return rpcData ?? { success: true };
}

export async function deactivateZigoPlus(supabase: SupabaseClient<Database>, userId: string) {
  const db = createAdminClient() ?? supabase;
  const now = new Date().toISOString();

  try {
    await (db.from("users") as unknown as {
      update: (data: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<unknown> };
    })
      .update({ is_premium: false, updated_at: now })
      .eq("id", userId);
  } catch (err) {
    console.warn("deactivateZigoPlus users update notice:", err);
  }

  try {
    await (db.from("user_subscriptions") as unknown as {
      upsert: (data: Record<string, unknown>, opts: { onConflict: string }) => Promise<{ error: { message: string } | null }>;
    }).upsert(
      {
        user_id: userId,
        tier: "free",
        status: "canceled",
        updated_at: now,
      },
      { onConflict: "user_id" },
    );
  } catch (err) {
    console.warn("deactivateZigoPlus user_subscriptions notice:", err);
  }

  try {
    await db.rpc("set_user_subscription_tier", {
      p_user_id: userId,
      p_tier: "free" as SubscriptionTier,
    });
  } catch {
    // Non-critical
  }

  return { success: true };
}
