import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { verifyAppleSubscription } from "@/lib/server/apple-iap";
import { DEFAULT_GOOGLE_PLAY_PACKAGE_NAME, verifyGooglePlaySubscription } from "@/lib/server/google-play";
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

    const planId = body.planId || body.productId || "zigo-plus-student-monthly";
    const now = new Date();
    let expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    let resolvedOrderId: string | null = body.orderId ?? null;

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
        return NextResponse.json(
          { error: "Sunucu hatası: App Store paylaşılan sır (shared secret) yapılandırılmamış." },
          { status: 500 },
        );
      }
    } else {
      // Android / Google Play (default)
      try {
        const packageName = body.packageName || DEFAULT_GOOGLE_PLAY_PACKAGE_NAME;
        const verified = await verifyGooglePlaySubscription(
          body.purchaseToken,
          body.productId || planId,
          packageName,
        );

        if (!verified.isValid) {
          return NextResponse.json({ error: "Google Play aboneliği doğrulanamadı." }, { status: 400 });
        }

        if (verified.expiryTimeIso) {
          expiresAt = verified.expiryTimeIso;
        }
        if (verified.orderId) {
          resolvedOrderId = verified.orderId;
        }

        // Call RPC for google play
        await supabase.rpc("record_google_play_purchase", {
          p_user_id: profile.id,
          p_plan_id: planId,
          p_product_id: verified.productId || body.productId || planId,
          p_purchase_token: body.purchaseToken,
          p_order_id: resolvedOrderId ?? undefined,
          p_package_name: packageName,
          p_expiry_time: expiresAt,
        }).then(({ error }) => {
          if (error) console.warn("record_google_play_purchase RPC:", error.message);
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Bilinmeyen hata";
        return NextResponse.json(
          { error: `Google Play doğrulama hatası: ${message}` },
          { status: 400 },
        );
      }
    }

    // Save subscription in database (user_subscriptions)
    const { error: upsertErr } = await (dbClient.from("user_subscriptions") as unknown as {
      upsert: (data: Record<string, unknown>, opts: { onConflict: string }) => Promise<{ error: { message: string } | null }>;
    }).upsert(
      {
        user_id: profile.id,
        plan_id: planId,
        product_id: body.productId || planId,
        tier: "zigo_plus",
        status: "active",
        started_at: now.toISOString(),
        current_period_end: expiresAt,
        expires_at: expiresAt,
        provider: body.platform === "ios" ? "apple" : "google_play",
        receipt_token: body.purchaseToken,
        order_id: resolvedOrderId,
      },
      { onConflict: "user_id" },
    );

    if (upsertErr) {
      console.warn("user_subscriptions upsert notice:", upsertErr.message);
    }

    // Update users.is_premium = true (the field getUserSubscription reads as fallback)
    await (dbClient.from("users") as unknown as { update: (data: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<unknown> } })
      .update({
        is_premium: true,
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
