// src/app/api/subscriptions/verify/route.ts

import { NextResponse } from "next/server";

import { getGooglePlayPackageName, verifyGooglePlaySubscription } from "@/lib/server/google-play";
import { createAdminClient, hasServiceRoleEnv } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/subscriptions/verify
 * Body: { receipt?: string; purchaseToken?: string; productId: string; packageName?: string }
 *
 * Verifies a Google Play subscription receipt, upserts the subscription
 * record in Supabase, updates users.is_premium and returns the subscription data.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = (body.receipt || body.purchaseToken || "").trim();
    const productId = (body.productId || body.planId || "zigo-plus-student-monthly").trim();

    if (!token || !productId) {
      return NextResponse.json({ error: "receipt (veya purchaseToken) ve productId gerekli" }, { status: 400 });
    }

    const supabase = await createClient();
    const dbClient = (hasServiceRoleEnv() ? createAdminClient() : null) ?? supabase;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
    }

    const packageName = getGooglePlayPackageName();
    if (body.packageName && body.packageName !== packageName) {
      return NextResponse.json({ error: "Geçersiz Android paket adı." }, { status: 400 });
    }

    // Verify with Google Play (supports Subscriptions v2 + v1 + sandbox fallback)
    const verification = await verifyGooglePlaySubscription(token, productId, packageName);

    if (!verification.isValid || !verification.expiryTimeIso || (verification.productId && verification.productId !== productId)) {
      return NextResponse.json({ error: "Google Play aboneliği doğrulanamadı veya geçerli değil." }, { status: 400 });
    }

    const now = new Date();
    const expiresAt = new Date(verification.expiryTimeIso);
    if (expiresAt <= now) {
      return NextResponse.json({ error: "Google Play aboneliğinin süresi dolmuş." }, { status: 400 });
    }

    // 1. RPC to record the purchase
    await supabase.rpc("record_google_play_purchase", {
      p_user_id: user.id,
      p_plan_id: productId,
      p_product_id: verification.productId || productId,
      p_purchase_token: token,
      p_order_id: verification.orderId ?? undefined,
      p_package_name: packageName,
      p_expiry_time: expiresAt.toISOString(),
    }).then(({ error }) => {
      if (error) console.warn("record_google_play_purchase RPC:", error.message);
    });

    // 2. Direct upsert to user_subscriptions (schema: user_id, tier, current_period_end, updated_at)
    await (dbClient.from("user_subscriptions") as unknown as {
      upsert: (data: Record<string, unknown>, opts: { onConflict: string }) => Promise<{ error: { message: string } | null }>;
    }).upsert(
      {
        user_id: user.id,
        tier: "zigo_plus",
        current_period_end: expiresAt.toISOString(),
        updated_at: now.toISOString(),
      },
      { onConflict: "user_id" },
    ).then(({ error }) => {
      if (error) console.warn("user_subscriptions upsert:", error.message);
    });

    // 3. Update users.is_premium = true (the field getUserSubscription reads as fallback)
    await (dbClient.from("users") as unknown as {
      update: (data: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<unknown> };
    })
      .update({ is_premium: true, ad_free_until: expiresAt.toISOString() })
      .eq("id", user.id);

    return NextResponse.json({
      success: true,
      subscription: {
        productId: verification.productId || productId,
        started_at: now,
        expires_at: expiresAt,
        isTrial: verification.isTrial ?? false,
      },
    });
  } catch (err) {
    console.error("Verification error:", err);
    return NextResponse.json({ error: "Sunucu hatası veya doğrulama başarısız." }, { status: 500 });
  }
}
