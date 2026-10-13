import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { DEFAULT_GOOGLE_PLAY_PACKAGE_NAME, verifyGooglePlaySubscription } from "@/lib/server/google-play";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Google Cloud Pub/Sub Webhook Payload Schema for Real-Time Developer Notifications (RTDN)
 */
const pubsubSchema = z.object({
  message: z.object({
    data: z.string(),
    messageId: z.string().optional(),
    publishTime: z.string().optional(),
  }),
  subscription: z.string().optional(),
});

type SubscriptionNotification = {
  version?: string;
  packageName?: string;
  eventTimeMillis?: string;
  subscriptionNotification?: {
    version?: string;
    notificationType?: number;
    purchaseToken?: string;
    subscriptionId?: string;
  };
};

export async function POST(request: Request) {
  try {
    // Pub/Sub must be configured with this secret as a header. Never process
    // unauthenticated notifications: a forged notification can revoke access.
    const webhookSecret = process.env.GOOGLE_PLAY_WEBHOOK_SECRET?.trim();
    if (!webhookSecret) {
      return NextResponse.json({ error: "Google Play webhook secret missing." }, { status: 503 });
    }
    const suppliedSecret = request.headers.get("x-google-play-webhook-secret") ?? "";
    const expected = Buffer.from(webhookSecret, "utf8");
    const supplied = Buffer.from(suppliedSecret, "utf8");
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const oidcAudience = process.env.GOOGLE_PLAY_PUBSUB_AUDIENCE?.trim();
    if (oidcAudience) {
      const authorization = request.headers.get("authorization") ?? "";
      const match = authorization.match(/^Bearer\s+(.+)$/i);
      if (!match) {
        return NextResponse.json({ error: "Pub/Sub OIDC token missing." }, { status: 401 });
      }

      const googleapis = await import("googleapis");
      const authClient = new googleapis.google.auth.OAuth2();
      let ticket;
      try {
        ticket = await authClient.verifyIdToken({ idToken: match[1], audience: oidcAudience });
      } catch {
        return NextResponse.json({ error: "Invalid Pub/Sub OIDC token." }, { status: 401 });
      }

      const payload = ticket.getPayload();
      const expectedServiceAccount = process.env.GOOGLE_PLAY_PUBSUB_SERVICE_ACCOUNT?.trim();
      const issuerValid = payload?.iss === "https://accounts.google.com" || payload?.iss === "accounts.google.com";
      if (!payload || !issuerValid || (expectedServiceAccount && payload.email !== expectedServiceAccount)) {
        return NextResponse.json({ error: "Unauthorized Pub/Sub principal." }, { status: 403 });
      }
    }

    const rawBody = await request.json().catch(() => null);
    if (!rawBody) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = pubsubSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid Pub/Sub payload structure" }, { status: 400 });
    }

    // Decode base64 data payload
    const decodedString = Buffer.from(parsed.data.message.data, "base64").toString("utf-8");
    let notification: SubscriptionNotification;
    try {
      notification = JSON.parse(decodedString) as SubscriptionNotification;
    } catch {
      return NextResponse.json({ error: "Invalid base64 encoded JSON notification" }, { status: 400 });
    }

    const subNotif = notification.subscriptionNotification;
    if (!subNotif || !subNotif.purchaseToken) {
      // Acknowledge non-subscription notification events gracefully
      return NextResponse.json({ status: "ignored_non_subscription_event" }, { status: 200 });
    }

    const purchaseToken = subNotif.purchaseToken;
    const subscriptionId = subNotif.subscriptionId ?? "zigo_plus";
    const notificationType = subNotif.notificationType;
    const packageName = notification.packageName ?? DEFAULT_GOOGLE_PLAY_PACKAGE_NAME;

    const adminClient = createAdminClient();
    if (!adminClient) {
      console.warn("[GOOGLE_PLAY_WEBHOOK] Service role client unavailable.");
      return NextResponse.json({ status: "skipped_no_service_role" }, { status: 200 });
    }

    // Determine status from notificationType
    // 1: RECOVERED, 2: RENEWED, 4: PURCHASED, 7: RESTARTED -> 'active'
    // 3: CANCELED -> 'canceled' (still active until expiry_time)
    // 5: ON_HOLD -> 'past_due'
    // 12: EXPIRED, 13: REVOKED -> 'expired'
    let newStatus = "active";
    if (notificationType === 3) newStatus = "canceled";
    else if (notificationType === 5) newStatus = "past_due";
    else if (notificationType === 12 || notificationType === 13) newStatus = "expired";

    let expiresAtIso: string | null = null;

    // Verify expiry time from Google Play API if configured
    try {
      const verifiedPurchase = await verifyGooglePlaySubscription(purchaseToken, subscriptionId, packageName);
      if (verifiedPurchase.expiryTimeIso) {
        expiresAtIso = verifiedPurchase.expiryTimeIso;
      } else if (verifiedPurchase.expiryTimeMillis) {
        expiresAtIso = new Date(Number(verifiedPurchase.expiryTimeMillis)).toISOString();
      }
    } catch (err) {
      console.warn("[GOOGLE_PLAY_WEBHOOK] API verify error:", err);
    }

    const now = new Date().toISOString();

    // 1. Find existing purchase by purchase_token in google_play_purchases
    const { data: gpRecord } = await adminClient
      .from("google_play_purchases")
      .select("user_id, plan_id, product_id, expiry_time")
      .eq("purchase_token", purchaseToken)
      .maybeSingle();

    if (gpRecord?.user_id) {
      const targetUserId = gpRecord.user_id;

      // Determine active premium entitlement:
      // If canceled, user stays premium until expiry_time passes
      const finalExpiry = expiresAtIso || gpRecord.expiry_time;
      const isPastExpiry = finalExpiry ? new Date(finalExpiry).getTime() <= Date.now() : false;
      const isStillPremium = (newStatus === "active" || (newStatus === "canceled" && !isPastExpiry)) && !isPastExpiry;

      // Update google_play_purchases table
      if (expiresAtIso) {
        await adminClient
          .from("google_play_purchases")
          .update({
            expiry_time: expiresAtIso,
            verified_at: now,
          })
          .eq("purchase_token", purchaseToken);
      }

      // Update user_subscriptions table (schema: user_id, tier, current_period_end, updated_at)
      await (adminClient.from("user_subscriptions") as unknown as {
        upsert: (data: Record<string, unknown>, opts: { onConflict: string }) => Promise<unknown>;
      }).upsert(
        {
          user_id: targetUserId,
          tier: isStillPremium ? "zigo_plus" : "free",
          current_period_end: finalExpiry ?? (isStillPremium ? null : "1970-01-01T00:00:00.000Z"),
          updated_at: now,
        },
        { onConflict: "user_id" },
      );

      // Update users table (schema: is_premium, ad_free_until)
      await (adminClient.from("users") as unknown as {
        update: (data: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<unknown> };
      })
        .update({
          is_premium: isStillPremium,
          ad_free_until: isStillPremium ? finalExpiry : null,
        })
        .eq("id", targetUserId);

      return NextResponse.json({
        status: "success",
        userId: targetUserId,
        notificationType,
        subscriptionStatus: newStatus,
        isPremium: isStillPremium,
      });
    }

    return NextResponse.json({
      status: "acknowledged",
      message: "Subscription record not found for token in google_play_purchases",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed";
    console.error("[GOOGLE_PLAY_WEBHOOK_ERROR]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
