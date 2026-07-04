import { NextResponse } from "next/server";

import { activateZigoPlus, deactivateZigoPlus } from "@/lib/domain/billing";
import {
  resolveUserIdByStripeCustomer,
  resolveUserIdByStripeSubscription,
  verifyStripeWebhookSignature,
} from "@/lib/domain/stripe-webhook";
import { createAdminClient } from "@/lib/supabase/admin";

type StripeEvent = {
  type?: string;
  data?: {
    object?: {
      id?: string;
      client_reference_id?: string;
      customer?: string;
      subscription?: string;
      current_period_end?: number;
      status?: string;
    };
  };
};

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret missing." }, { status: 503 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Service role required." }, { status: 503 });
  }

  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!verifyStripeWebhookSignature(payload, signature, secret)) {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(payload) as StripeEvent;
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const object = event.data?.object;

  try {
    if (event.type === "checkout.session.completed" && object?.client_reference_id) {
      await activateZigoPlus(admin, object.client_reference_id, {
        stripeCustomerId: typeof object.customer === "string" ? object.customer : undefined,
        stripeSubscriptionId: typeof object.subscription === "string" ? object.subscription : undefined,
        currentPeriodEnd: object.current_period_end
          ? new Date(object.current_period_end * 1000).toISOString()
          : undefined,
      });
    }

    if (
      event.type === "customer.subscription.deleted" ||
      (event.type === "customer.subscription.updated" &&
        (object?.status === "canceled" || object?.status === "unpaid" || object?.status === "incomplete_expired"))
    ) {
      const subscriptionId = object?.id;
      const customerId = typeof object?.customer === "string" ? object.customer : undefined;

      const userId =
        (subscriptionId ? await resolveUserIdByStripeSubscription(admin, subscriptionId) : null) ??
        (customerId ? await resolveUserIdByStripeCustomer(admin, customerId) : null);

      if (userId) {
        await deactivateZigoPlus(admin, userId);
      }
    }

    if (event.type === "customer.subscription.updated" && object?.status === "active" && object.id) {
      const userId = await resolveUserIdByStripeSubscription(admin, object.id);
      if (userId) {
        await activateZigoPlus(admin, userId, {
          stripeCustomerId: typeof object.customer === "string" ? object.customer : undefined,
          stripeSubscriptionId: object.id,
          currentPeriodEnd: object.current_period_end
            ? new Date(object.current_period_end * 1000).toISOString()
            : undefined,
        });
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook handler failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ received: true });
}
