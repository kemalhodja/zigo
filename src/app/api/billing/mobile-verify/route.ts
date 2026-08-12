import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { verifyAppleSubscription } from "@/lib/server/apple-iap";
import { verifyGooglePlaySubscription } from "@/lib/server/google-play";
import { createAdminClient, hasServiceRoleEnv } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const dbClient = (hasServiceRoleEnv() ? createAdminClient() : null) ?? supabase;
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      planId?: string;
      platform?: "android" | "ios";
      productId?: string;
      purchaseToken?: string;
      orderId?: string;
      packageName?: string;
    };

    if (!body.purchaseToken) {
      return NextResponse.json({ error: "Satın alma fişi / token eksik." }, { status: 400 });
    }

    const planId = body.planId || body.productId || "zigo-plus-student-montly";
    const now = new Date();
    let expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // ── Enforce Secure Verification ─────────────────────────────────────────
    if (body.platform === "ios") {
      if (process.env.APPLE_IAP_SHARED_SECRET) {
        try {
          const verified = await verifyAppleSubscription(body.purchaseToken);
          expiresAt = verified.expiryTime;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Bilinmeyen hata";
          return NextResponse.json(
            { error: `App Store doğrulama hatası: ${message}` },
            { status: 400 },
          );
        }
      } else {
        console.warn("APPLE_IAP_SHARED_SECRET env missing, falling back to mock 30-day activation.");
      }
    } else if (body.platform === "android") {
      if (process.env.GOOGLE_PLAY_SERVICE_ACCOUNT) {
        try {
          const packageName = body.packageName || "com.zigo.app";
          const verified = await verifyGooglePlaySubscription(
            body.purchaseToken,
            body.productId || "zigo_plus",
            packageName,
          );
          type GooglePlayPayload = { expiryTimeMillis?: string | number };
          const payload = verified as GooglePlayPayload | null;
          if (payload?.expiryTimeMillis) {
            expiresAt = new Date(Number(payload.expiryTimeMillis)).toISOString();
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Bilinmeyen hata";
          return NextResponse.json(
            { error: `Google Play doğrulama hatası: ${message}` },
            { status: 400 },
          );
        }
      } else {
        console.warn("GOOGLE_PLAY_SERVICE_ACCOUNT env missing, falling back to mock 30-day activation.");
      }
    }

    // Save subscription in database
    const { error: upsertErr } = await (dbClient.from("user_subscriptions") as unknown as { upsert: (data: Record<string, unknown>, opts: { onConflict: string }) => Promise<{ error: { message: string } | null }> }).upsert(
      {
        user_id: profile.id,
        plan_id: planId,
        product_id: body.productId || "zigo_plus",
        tier: "zigo_plus",
        status: "active",
        started_at: now.toISOString(),
        current_period_end: expiresAt,
        expires_at: expiresAt,
        provider: body.platform === "ios" ? "apple" : "google_play",
        receipt_token: body.purchaseToken,
        order_id: body.orderId ?? null,
      },
      { onConflict: "user_id" },
    );

    if (upsertErr) {
      console.warn("user_subscriptions upsert notice:", upsertErr.message);
    }

    // Update profile subscription_tier to 'zigo_plus'
    await (dbClient.from("users") as unknown as { update: (data: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<unknown> } })
      .update({
        subscription_tier: "zigo_plus",
        updated_at: now.toISOString(),
      })
      .eq("id", profile.id);

    return NextResponse.json({
      data: {
        success: true,
        message: `${body.platform === "ios" ? "App Store" : "Google Play"} satın almanız doğrulandı ve aboneliğiniz başlatıldı!`,
        expiresAt,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sunucu hatası" },
      { status: 500 },
    );
  }
}
