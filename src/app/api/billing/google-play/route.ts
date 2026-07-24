import { NextResponse } from "next/server";
import { z } from "zod";

import {
  assertGooglePlayPurchasePayload,
  hasGooglePlayVerifierConfigured,
  verifyGooglePlaySubscription,
  ZIGO_ANDROID_PACKAGE_NAME,
} from "@/lib/domain/google-play";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { findPlanGroup } from "@/lib/domain/subscription-plans";
import { createClient } from "@/lib/supabase/server";

const googlePlaySchema = z.object({
  planId: z.string().trim().min(3).max(80),
  productId: z.string().trim().min(3).max(80),
  purchaseToken: z.string().trim().min(20),
  packageName: z.string().trim().min(3).default(ZIGO_ANDROID_PACKAGE_NAME),
  orderId: z.string().trim().optional().nullable(),
  expiryTime: z.string().trim().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = googlePlaySchema.parse(await request.json().catch(() => ({})));

    if (!findPlanGroup(body.planId)) {
      return NextResponse.json({ error: "Geçersiz abonelik planı." }, { status: 400 });
    }

    try {
      assertGooglePlayPurchasePayload(body);
    } catch (error) {
      const code = error instanceof Error ? error.message : "INVALID_PURCHASE";
      return NextResponse.json(
        {
          error:
            code === "MOCK_PURCHASE_TOKEN"
              ? "Sahte Google Play satın alma reddedildi. Gerçek Play Billing akışı gerekli."
              : "Google Play satın alma verisi geçersiz.",
          code,
        },
        { status: 400 },
      );
    }

  if (!hasGooglePlayVerifierConfigured()) {
    // Local/demo escape hatch only — never accept mock tokens (asserted above).
    if (process.env.ZIGO_GOOGLE_PLAY_DEV_BYPASS === "true" && process.env.ZIGO_BILLING_DEV_BYPASS === "true") {
      // fall through to record without Google API (explicit dual opt-in for local QA)
    } else {
      return NextResponse.json(
        {
          error:
            "Google Play sunucu doğrulaması yapılandırılmadı. Abonelik otomatik açılamaz. GOOGLE_PLAY_SERVICE_ACCOUNT_JSON ekleyin.",
          code: "VERIFIER_UNCONFIGURED",
        },
        { status: 503 },
      );
    }
  }

  let expiryTime = body.expiryTime ?? null;
  if (hasGooglePlayVerifierConfigured()) {
    const verified = await verifyGooglePlaySubscription({
      packageName: body.packageName,
      productId: body.productId,
      purchaseToken: body.purchaseToken,
    });

    if (!verified.ok) {
      return NextResponse.json(
        {
          error: "Google Play ödemesi doğrulanamadı. Abonelik açılmadı.",
          code: verified.code,
          detail: "detail" in verified ? verified.detail : undefined,
        },
        { status: 402 },
      );
    }
    expiryTime = verified.expiryTime ?? expiryTime;
  }

  const { data, error } = await supabase.rpc("record_google_play_purchase", {
    p_user_id: profile.id,
    p_plan_id: body.planId,
    p_product_id: body.productId,
    p_purchase_token: body.purchaseToken,
    p_order_id: body.orderId ?? null,
    p_package_name: body.packageName,
    p_expiry_time: expiryTime,
  });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Geçersiz Google Play satın alma verisi." }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Google Play purchase verification failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
