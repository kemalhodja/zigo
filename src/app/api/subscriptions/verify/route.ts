// src/app/api/subscriptions/verify/route.ts

import { NextResponse } from "next/server";

import { verifyGooglePlaySubscription } from "@/lib/server/google-play";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/subscriptions/verify
 * Body: { receipt: string; productId: string }
 *
 * Verifies a Google Play subscription receipt, upserts the subscription
 * record in Supabase and returns the subscription data.
 */
export async function POST(req: Request) {
  try {
    const { receipt, productId } = await req.json();
    if (!receipt || !productId) {
      return NextResponse.json({ error: "Missing receipt or productId" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const packageName = process.env.NEXT_PUBLIC_GOOGLE_PLAY_PACKAGE_NAME;
    if (!packageName) {
      return NextResponse.json({ error: "Package name not configured" }, { status: 500 });
    }

    // Verify with Google Play
    const purchase = await verifyGooglePlaySubscription(receipt, productId, packageName);
    if (!purchase || purchase.paymentState !== 1) { // 1 = Paid
      return NextResponse.json({ error: "Purchase not valid" }, { status: 400 });
    }

    const now = new Date();
    const expiresAt = new Date(purchase.expiryTimeMillis);

    // Call the RPC to record the purchase and update the user's subscription tier
    const { error } = await supabase.rpc("record_google_play_purchase", {
      p_user_id: user.id,
      p_plan_id: productId,
      p_product_id: productId,
      p_purchase_token: receipt,
      p_order_id: purchase.orderId || null,
      p_package_name: packageName,
      p_expiry_time: expiresAt.toISOString(),
    });

    if (error) {
      console.error("Supabase RPC error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ success: true, subscription: { productId, started_at: now, expires_at: expiresAt } });
  } catch (err) {
    console.error("Verification error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
