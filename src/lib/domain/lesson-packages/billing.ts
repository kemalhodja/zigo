import type { SupabaseClient } from "@supabase/supabase-js";

import { getSiteUrl } from "@/lib/domain/deploy-config";
import type { Database } from "@/lib/supabase/database.types";

import { activateLessonPackageSubscription } from "./subscription";
import {
  findLessonPackagePlan,
  resolveLessonPackageStripePriceId,
  type LessonPackagePlanId,
} from "./plans";

export async function createLessonPackageCheckoutSession(
  userId: string,
  email: string,
  planId: LessonPackagePlanId,
) {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  const priceId = resolveLessonPackageStripePriceId(planId);
  const plan = findLessonPackagePlan(planId);

  if (!secret || !priceId || !plan) {
    throw new Error("Stripe lesson package prices are not configured.");
  }

  const siteUrl = getSiteUrl();
  const body = new URLSearchParams({
    mode: "payment",
    success_url: `${siteUrl}/parent/packages?success=1&plan=${planId}`,
    cancel_url: `${siteUrl}/parent/packages?cancelled=1`,
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    client_reference_id: userId,
    customer_email: email,
    "metadata[purchase_type]": "lesson_package",
    "metadata[plan_id]": planId,
  });

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

export async function handleLessonPackageCheckoutCompleted(
  supabase: SupabaseClient<Database>,
  input: {
    userId: string;
    planId: LessonPackagePlanId;
    stripeCheckoutSessionId?: string;
  },
) {
  const plan = findLessonPackagePlan(input.planId);
  if (!plan) throw new Error("Unknown lesson package plan.");

  return activateLessonPackageSubscription(supabase, {
    userId: input.userId,
    planType: input.planId,
    durationDays: plan.durationDays,
    stripeCheckoutSessionId: input.stripeCheckoutSessionId,
  });
}

export function hasLessonPackageStripeConfigured(planId: LessonPackagePlanId) {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim() && resolveLessonPackageStripePriceId(planId));
}
