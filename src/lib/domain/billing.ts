import type { SupabaseClient } from "@supabase/supabase-js";

import { isLocalDemoSupabase } from "@/lib/domain/demo-env";
import { getSiteUrl } from "@/lib/domain/deploy-config";
import { ensureStripeCampaignCoupon } from "@/lib/domain/stripe-campaign-provision";
import {
  getSubscriptionCampaignStripeCouponId,
  isSubscriptionCampaignActive,
} from "@/lib/domain/subscription-campaign";
import { findPlanGroup, resolveStripePriceId } from "@/lib/domain/subscription-plans";
import type { Database, SubscriptionTier } from "@/lib/supabase/database.types";

export function hasStripeConfigured() {
  if (process.env.STRIPE_SECRET_KEY?.trim() && process.env.STRIPE_PRICE_ID_ZIGO_PLUS?.trim()) {
    return true;
  }
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() &&
      resolveStripePriceId("student-monthly"),
  );
}

export function canUseDevBillingBypass() {
  return isLocalDemoSupabase() || process.env.ZIGO_BILLING_DEV_BYPASS === "true";
}

export async function createZigoPlusCheckoutSession(
  userId: string,
  email: string,
  planId = "student-monthly",
) {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  const priceId = resolveStripePriceId(planId);
  if (!secret || !priceId) {
    throw new Error("Stripe is not configured. Add STRIPE_SECRET_KEY and plan price IDs.");
  }

  const siteUrl = getSiteUrl();
  const cancelPath = findPlanGroup(planId)?.cancelPath ?? "/student?billing=cancelled";
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

  if (isSubscriptionCampaignActive()) {
    try {
      await ensureStripeCampaignCoupon(secret);
    } catch {
      // Checkout can still proceed; coupon may already exist in Stripe.
    }
    const couponId = getSubscriptionCampaignStripeCouponId();
    if (couponId) {
      body.set("discounts[0][coupon]", couponId);
      body.set("metadata[campaign_id]", "yaz-2026-75");
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
  const { data, error } = await supabase.rpc("set_user_subscription_tier", {
    p_user_id: userId,
    p_tier: "zigo_plus" as SubscriptionTier,
    p_stripe_customer_id: options?.stripeCustomerId,
    p_stripe_subscription_id: options?.stripeSubscriptionId,
    p_current_period_end: options?.currentPeriodEnd,
  });

  if (error) throw error;
  return data;
}

export async function deactivateZigoPlus(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase.rpc("set_user_subscription_tier", {
    p_user_id: userId,
    p_tier: "free" as SubscriptionTier,
  });

  if (error) throw error;
  return data;
}
