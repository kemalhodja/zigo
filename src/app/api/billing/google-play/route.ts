import { NextResponse } from "next/server";
import { z } from "zod";

import { shouldBlockSelfServeOrgCheckout } from "@/lib/domain/organization-sales";
import { getCurrentProfile, parseOrganizationType } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

const googlePlaySchema = z.object({
  planId: z.string().trim().min(3).max(80),
  productId: z.string().trim().min(3).max(80),
  purchaseToken: z.string().trim().min(5),
  packageName: z.string().trim().min(3).default("com.zigo.app"),
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

    if (shouldBlockSelfServeOrgCheckout(parseOrganizationType(profile.organization_type), body.planId)) {
      return NextResponse.json(
        {
          error:
            "Kurumsal abonelikler satış ekibi üzerinden açılır. WhatsApp ile kurumsal teklif alın.",
          code: "ORG_SALES_ASSISTED",
        },
        { status: 403 },
      );
    }

    const { data, error } = await supabase.rpc("record_google_play_purchase", {
      p_user_id: profile.id,
      p_plan_id: body.planId,
      p_product_id: body.productId,
      p_purchase_token: body.purchaseToken,
      p_order_id: body.orderId ?? null,
      p_package_name: body.packageName,
      p_expiry_time: body.expiryTime ?? null,
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
