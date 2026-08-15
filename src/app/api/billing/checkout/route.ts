import { NextResponse } from "next/server";
import { z } from "zod";

import { createZigoPlusCheckoutSession, hasStripeConfigured } from "@/lib/domain/billing";
import { getBillingPlatformMessage, isWebCheckoutAllowedForRequest } from "@/lib/domain/billing-platform";
import { shouldBlockSelfServeOrgCheckout } from "@/lib/domain/organization-sales";
import { getCurrentProfile, parseOrganizationType } from "@/lib/domain/profiles";
import { findPlanGroup } from "@/lib/domain/subscription-plans";
import { getServerLocale } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

const checkoutSchema = z.object({
  planId: z.string().trim().min(3).max(80).optional(),
});

export async function POST(request: Request) {
  try {
    if (!hasStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe henüz yapılandırılmadı. Yerel demo için dev activate kullanın." },
        { status: 503 },
      );
    }

    if (!isWebCheckoutAllowedForRequest(request)) {
      const locale = await getServerLocale();
      return NextResponse.json(
        { error: getBillingPlatformMessage(locale), code: "PLAY_STORE_BILLING_REQUIRED" },
        { status: 403 },
      );
    }

    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = checkoutSchema.parse(await request.json().catch(() => ({})));
    const defaultPlanId =
      profile.role === "teacher"
        ? "zigo-plus-teachers-monthly"
        : profile.role === "student" || profile.role === "parent"
          ? "zigo-plus-student-monthly"
          : "zigo-plus-student-monthly";
    const planId = body.planId ?? defaultPlanId;

    if (!findPlanGroup(planId)) {
      return NextResponse.json({ error: "Geçersiz abonelik planı." }, { status: 400 });
    }

    if (shouldBlockSelfServeOrgCheckout(parseOrganizationType(profile.organization_type), planId)) {
      return NextResponse.json(
        {
          error:
            "Kurumsal abonelikler satış ekibi üzerinden açılır. WhatsApp ile kurumsal teklif alın.",
          code: "ORG_SALES_ASSISTED",
        },
        { status: 403 },
      );
    }

    const session = await createZigoPlusCheckoutSession(
      profile.id,
      profile.email,
      planId,
      profile.created_at,
    );
    return NextResponse.json({ data: { url: session.url, planId } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Geçersiz checkout isteği." }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Checkout could not be started.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
