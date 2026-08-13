import { NextResponse } from "next/server";
import { z } from "zod";

import { shouldBlockSelfServeOrgCheckout } from "@/lib/domain/organization-sales";
import { getCurrentProfile, parseOrganizationType } from "@/lib/domain/profiles";
import { verifyGooglePlaySubscription } from "@/lib/server/google-play";
import { createAdminClient, hasServiceRoleEnv } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const googlePlaySchema = z.object({
  planId: z.string().trim().min(3).max(80).default("zigo-plus-student-montly"),
  productId: z.string().trim().min(3).max(80).default("zigo_plus"),
  purchaseToken: z.string().trim().min(5),
  packageName: z.string().trim().min(3).default("com.zigo.app"),
  orderId: z.string().trim().optional().nullable(),
  expiryTime: z.string().trim().optional().nullable(),
  offerToken: z.string().trim().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile) {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
    }

    const body = googlePlaySchema.parse(await request.json().catch(() => ({})));

    if (shouldBlockSelfServeOrgCheckout(parseOrganizationType(profile.organization_type), body.planId)) {
      return NextResponse.json(
        {
          error: "Kurumsal abonelikler satış ekibi üzerinden açılır. WhatsApp ile kurumsal teklif alın.",
          code: "ORG_SALES_ASSISTED",
        },
        { status: 403 },
      );
    }

    let verifiedExpiryTime: string | null = body.expiryTime ?? null;

    // Verify with official Google Play Developer API if credentials are present in env
    if (process.env.GOOGLE_PLAY_SERVICE_ACCOUNT) {
      if (body.offerToken) {
        console.log(`[Google Play] Validating purchase with offerToken: ${body.offerToken}`);
      }
      try {
        const verifiedPurchase = await verifyGooglePlaySubscription(
          body.purchaseToken,
          body.productId,
          body.packageName,
        );
        type GooglePlayPayload = { expiryTimeMillis?: string | number };
        const payload = verifiedPurchase as GooglePlayPayload | null;
        if (payload?.expiryTimeMillis) {
          verifiedExpiryTime = new Date(Number(payload.expiryTimeMillis)).toISOString();
        }
      } catch (gplayErr) {
        console.warn("Google Play API verification skipped or failed:", gplayErr);
      }
    }

    // Default to 30 days trial/subscription period if expiry time is not set
    const now = new Date();
    const defaultExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const finalExpiryTime = verifiedExpiryTime || defaultExpiry;

    // 1. Record Google Play Purchase via RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc("record_google_play_purchase", {
      p_user_id: profile.id,
      p_plan_id: body.planId,
      p_product_id: body.productId,
      p_purchase_token: body.purchaseToken,
      p_order_id: body.orderId ?? undefined,
      p_package_name: body.packageName,
      p_expiry_time: finalExpiryTime,
    });

    if (rpcError) {
      console.warn("RPC record_google_play_purchase failed, falling back to direct table sync:", rpcError.message);
    }

    // 2. Direct Sync with user_subscriptions table for status='active' & tier='zigo_plus'
    const dbClient = (hasServiceRoleEnv() ? createAdminClient() : null) ?? supabase;
    const { error: upsertErr } = await (dbClient.from("user_subscriptions") as unknown as { upsert: (data: Record<string, unknown>, opts: { onConflict: string }) => Promise<{ error: { message: string } | null }> }).upsert(
      {
        user_id: profile.id,
        plan_id: body.planId,
        product_id: body.productId,
        tier: "zigo_plus",
        status: "active",
        started_at: now.toISOString(),
        current_period_end: finalExpiryTime,
        expires_at: finalExpiryTime,
        provider: "google_play",
        receipt_token: body.purchaseToken,
        order_id: body.orderId ?? null,
      },
      { onConflict: "user_id" },
    );

    if (upsertErr) {
      console.warn("user_subscriptions upsert notice:", upsertErr.message);
    }

    // 3. Update profile subscription_tier to 'zigo_plus'
    await (dbClient.from("users") as unknown as { update: (data: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<unknown> } })
      .update({
        subscription_tier: "zigo_plus",
        updated_at: now.toISOString(),
      })
      .eq("id", profile.id);

    return NextResponse.json({
      success: true,
      message: "Google Play ZigoPlus aboneliğiniz ve 30 günlük denemeniz aktifleştirildi!",
      data: {
        userId: profile.id,
        productId: body.productId,
        planId: body.planId,
        status: "active",
        tier: "zigo_plus",
        expiresAt: finalExpiryTime,
        rpcData,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Geçersiz Google Play satın alma verisi." }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Google Play satın alma doğrulaması başarısız.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

