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

    // Upsert subscription record
    const { error } = await (supabase.from("user_subscriptions") as unknown as { upsert: (data: Record<string, unknown>, opts?: { onConflict?: string }) => Promise<{ error: unknown }> }).upsert({
      user_id: user.id,
      product_id: productId,
      status: "active",
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      receipt_token: receipt,
    }, { onConflict: "user_id" });

    if (error) {
      console.error("Supabase upsert error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ success: true, subscription: { productId, started_at: now, expires_at: expiresAt } });
  } catch (err) {
    console.error("Verification error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
