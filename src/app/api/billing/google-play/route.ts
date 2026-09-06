import { NextResponse } from "next/server";
import { z } from "zod";

import { shouldBlockSelfServeOrgCheckout } from "@/lib/domain/organization-sales";
import { getCurrentProfile, parseOrganizationType } from "@/lib/domain/profiles";
import { getGooglePlayPackageName, verifyGooglePlaySubscription } from "@/lib/server/google-play";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const googlePlaySchema = z.object({
  planId: z.string().trim().min(3).max(80).default("zigo-plus-student-monthly"),
  productId: z.string().trim().min(3).max(80).default("zigo-plus-student-monthly"),
  purchaseToken: z.string().trim().min(5),
  packageName: z.string().trim().min(3).optional(),
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

    const packageName = getGooglePlayPackageName();
    if (body.packageName && body.packageName !== packageName) {
      return NextResponse.json({ error: "Geçersiz Android paket adı." }, { status: 400 });
    }

    const verifiedPurchase = await verifyGooglePlaySubscription(body.purchaseToken, body.productId, packageName);
    if (!verifiedPurchase.isValid || !verifiedPurchase.expiryTimeIso) {
      return NextResponse.json({ error: "Google Play satın alımı doğrulanamadı." }, { status: 400 });
    }
    if (verifiedPurchase.productId && verifiedPurchase.productId !== body.productId) {
      return NextResponse.json({ error: "Satın alınan ürün seçilen planla eşleşmiyor." }, { status: 400 });
    }

    const now = new Date();
    const finalExpiryTime = verifiedPurchase.expiryTimeIso;
    if (new Date(finalExpiryTime).getTime() <= now.getTime()) {
      return NextResponse.json({ error: "Google Play aboneliğinin süresi dolmuş." }, { status: 400 });
    }
    const verifiedOrderId = verifiedPurchase.orderId ?? null;
    const isTrial = Boolean(verifiedPurchase.isTrial);

    const adminDb = createAdminClient();
    if (!adminDb) {
      return NextResponse.json({ error: "Satın alma kaydı için sunucu yapılandırması eksik." }, { status: 503 });
    }
    const { data: existingPurchase } = await adminDb
      .from("google_play_purchases")
      .select("user_id")
      .eq("purchase_token", body.purchaseToken)
      .maybeSingle();
    if (existingPurchase && existingPurchase.user_id !== profile.id) {
      return NextResponse.json({ error: "Bu satın alma başka bir hesaba bağlı." }, { status: 409 });
    }

    // 1. Record Google Play Purchase via RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc("record_google_play_purchase", {
      p_user_id: profile.id,
      p_plan_id: body.planId,
      p_product_id: body.productId,
      p_purchase_token: body.purchaseToken,
      p_order_id: verifiedOrderId ?? undefined,
      p_package_name: packageName,
      p_expiry_time: finalExpiryTime,
    });

    if (rpcError) {
      console.warn("RPC record_google_play_purchase failed, falling back to direct table sync:", rpcError.message);
    }

    // 2. Direct Sync with user_subscriptions table (valid schema: user_id, tier, current_period_end, updated_at)
    const dbClient = adminDb;
    const { error: upsertErr } = await (dbClient.from("user_subscriptions") as unknown as {
      upsert: (data: Record<string, unknown>, opts: { onConflict: string }) => Promise<{ error: { message: string } | null }>;
    }).upsert(
      {
        user_id: profile.id,
        tier: "zigo_plus",
        current_period_end: finalExpiryTime,
        updated_at: now.toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (upsertErr) {
      console.warn("user_subscriptions upsert notice:", upsertErr.message);
    }

    // 2.5 Ensure backup row in google_play_purchases
    try {
      await (dbClient.from("google_play_purchases") as unknown as {
        upsert: (data: Record<string, unknown>, opts: { onConflict: string }) => Promise<unknown>;
      }).upsert(
        {
          user_id: profile.id,
          plan_id: body.planId,
          product_id: body.productId,
          purchase_token: body.purchaseToken,
          order_id: verifiedOrderId ?? null,
          package_name: packageName,
          expiry_time: finalExpiryTime,
          verified_at: now.toISOString(),
        },
        { onConflict: "purchase_token" },
      );
    } catch {
      // silent
    }

    // 3. Set users.is_premium = true and ad_free_until (users schema does not have updated_at)
    await (dbClient.from("users") as unknown as {
      update: (data: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<unknown> };
    })
      .update({
        is_premium: true,
        ad_free_until: finalExpiryTime,
      })
      .eq("id", profile.id);

    return NextResponse.json({
      success: true,
      message: isTrial
        ? "Google Play Zigo Plus 7 günlük denemeniz ve aboneliğiniz aktifleştirildi!"
        : "Google Play Zigo Plus aboneliğiniz başarıyla aktifleştirildi!",
      data: {
        userId: profile.id,
        productId: body.productId,
        planId: body.planId,
        status: "active",
        tier: "zigo_plus",
        isTrial,
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
