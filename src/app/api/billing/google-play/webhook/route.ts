import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyGooglePlaySubscription } from "@/lib/server/google-play";
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
    const packageName = notification.packageName ?? "com.zigo.app";
    const notificationType = subNotif.notificationType ?? 0;

    const adminClient = createAdminClient();
    if (!adminClient) {
      console.warn("[GOOGLE_PLAY_WEBHOOK] Service role client unavailable.");
      return NextResponse.json({ status: "skipped_no_service_role" }, { status: 200 });
    }

    // Determine status from notificationType
    // 1: RECOVERED, 2: RENEWED, 4: PURCHASED -> 'active'
    // 3: CANCELED -> 'canceled'
    // 5: ON_HOLD -> 'past_due'
    // 12: EXPIRED, 13: REVOKED -> 'expired'
    let newStatus = "active";
    if (notificationType === 3) newStatus = "canceled";
    else if (notificationType === 5) newStatus = "past_due";
    else if (notificationType === 12 || notificationType === 13) newStatus = "expired";

    let expiresAtIso: string | null = null;

    // Verify expiry time from Google Play API if configured
    if (process.env.GOOGLE_PLAY_SERVICE_ACCOUNT) {
      try {
        const verifiedPurchase = await verifyGooglePlaySubscription(purchaseToken, subscriptionId, packageName);
        type GooglePlayPayload = { expiryTimeMillis?: string | number };
        const payload = verifiedPurchase as GooglePlayPayload | null;
        if (payload?.expiryTimeMillis) {
          expiresAtIso = new Date(Number(payload.expiryTimeMillis)).toISOString();
        }
      } catch (err) {
        console.warn("[GOOGLE_PLAY_WEBHOOK] API verify error:", err);
      }
    }

    const now = new Date().toISOString();

    // 1. Find existing subscription by purchase token
    const { data: subRecord } = await (adminClient
      .from("user_subscriptions") as unknown as {
      select: (cols: string) => { eq: (col: string, val: string) => { maybeSingle: () => Promise<{ data: { user_id: string; id: string } | null }> } };
    })
      .select("id, user_id")
      .eq("receipt_token", purchaseToken)
      .maybeSingle();

    if (subRecord?.user_id) {
      const targetUserId = subRecord.user_id;

      // Update user_subscriptions
      await (adminClient.from("user_subscriptions") as unknown as {
        update: (data: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<unknown> };
      })
        .update({
          status: newStatus,
          updated_at: now,
          ...(expiresAtIso ? { current_period_end: expiresAtIso, expires_at: expiresAtIso } : {}),
        })
        .eq("receipt_token", purchaseToken);

      // Update users.is_premium (the field getUserSubscription reads)
      const newIsPremium = newStatus === "active";
      await (adminClient.from("users") as unknown as {
        update: (data: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<unknown> };
      })
        .update({
          is_premium: newIsPremium,
          updated_at: now,
        })
        .eq("id", targetUserId);

      return NextResponse.json({
        status: "success",
        userId: targetUserId,
        notificationType,
        subscriptionStatus: newStatus,
      });
    }

    return NextResponse.json({
      status: "acknowledged",
      message: "Subscription record not found for token",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed";
    console.error("[GOOGLE_PLAY_WEBHOOK_ERROR]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
