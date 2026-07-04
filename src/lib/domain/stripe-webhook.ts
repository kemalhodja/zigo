import { createHmac, timingSafeEqual } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

const WEBHOOK_TOLERANCE_SECONDS = 300;

export function verifyStripeWebhookSignature(
  payload: string,
  signatureHeader: string | null,
  secret: string,
): boolean {
  if (!signatureHeader) return false;

  const parts = signatureHeader.split(",").map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));

  if (!timestamp || signatures.length === 0) return false;

  const age = Math.floor(Date.now() / 1000) - Number(timestamp);
  if (!Number.isFinite(age) || age < 0 || age > WEBHOOK_TOLERANCE_SECONDS) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const expected = createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");

  return signatures.some((signature) => {
    const received = Buffer.from(signature, "utf8");
    if (received.length !== expectedBuffer.length) return false;
    return timingSafeEqual(received, expectedBuffer);
  });
}

export async function resolveUserIdByStripeSubscription(
  admin: SupabaseClient<Database>,
  stripeSubscriptionId: string,
) {
  const { data, error } = await admin
    .from("user_subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", stripeSubscriptionId)
    .maybeSingle();

  if (error) throw error;
  return data?.user_id ?? null;
}

export async function resolveUserIdByStripeCustomer(
  admin: SupabaseClient<Database>,
  stripeCustomerId: string,
) {
  const { data, error } = await admin
    .from("user_subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();

  if (error) throw error;
  return data?.user_id ?? null;
}
