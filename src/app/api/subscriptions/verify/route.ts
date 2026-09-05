// src/app/api/subscriptions/verify/route.ts

import { NextResponse } from "next/server";

import { createAdminClient, hasServiceRoleEnv } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { verifyGooglePlaySubscription } from "@/lib/server/google-play";

/**
 * POST /api/subscriptions/verify
 * Body: { receipt: string; productId: string }
 *
 * Verifies a Google Play subscription receipt, upserts the subscription
 * record in Supabase, updates users.is_premium and returns the subscription data.
 */
export async function POST(req: Request) {
  try {
    const { receipt, productId } = await req.json();
    if (!receipt || !productId) {
      return NextResponse.json({ error: "Missing receipt or productId" }, { status: 400 });
    }

    const supabase = await createClient();
    const dbClient = (hasServiceRoleEnv() ? createAdminClient() : null) ?? supabase;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const packageName = process.env.NEXT_PUBLIC_GOOGLE_PLAY_PACKAGE_NAME || "com.zigo.app";

    // Verify with Google Play
    const purchase = await verifyGooglePlaySubscription(receipt, productId, packageName);
    type GooglePlayPurchase = { paymentState?: number; expiryTimeMillis?: string | number; orderId?: string };
    const gp = purchase as GooglePlayPurchase | null;
    if (!gp || gp.paymentState !== 1) {
      return NextResponse.json({ error: "Purchase not valid" }, { status: 400 });
    }

    const now = new Date();
    const expiresAt = gp.expiryTimeMillis ? new Date(Number(gp.expiryTimeMillis)) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // 1. RPC to record the purchase
    await supabase.rpc("record_google_play_purchase", {
      p_user_id: user.id,
      p_plan_id: productId,
      p_product_id: productId,
      p_purchase_token: receipt,
      p_order_id: gp.orderId ?? undefined,
      p_package_name: packageName,
      p_expiry_time: expiresAt.toISOString(),
    }).then(({ error }) => { if (error) console.warn("record_google_play_purchase RPC:", error.message); });

    // 2. Direct upsert to user_subscriptions
    await (dbClient.from("user_subscriptions") as unknown as {
      upsert: (data: Record<string, unknown>, opts: { onConflict: string }) => Promise<{ error: { message: string } | null }>;
    }).upsert(
      {
        user_id: user.id,
        plan_id: productId,
        product_id: productId,
        tier: "zigo_plus",
        status: "active",
        started_at: now.toISOString(),
        current_period_end: expiresAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        provider: "google_play",
        receipt_token: receipt,
        order_id: gp.orderId || null,
      },
      { onConflict: "user_id" },
    ).then(({ error }) => { if (error) console.warn("user_subscriptions upsert:", error.message); });

    // 3. Update users.is_premium = true (field getUserSubscription reads)
    await (dbClient.from("users") as unknown as {
      update: (data: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<unknown> };
    })
      .update({ is_premium: true, updated_at: now.toISOString() })
      .eq("id", user.id);

    return NextResponse.json({ success: true, subscription: { productId, started_at: now, expires_at: expiresAt } });
  } catch (err) {
    console.error("Verification error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
