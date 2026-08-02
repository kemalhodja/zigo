import { NextResponse } from "next/server";
import { z } from "zod";

import { canUseDevBillingBypass } from "@/lib/domain/billing";
import {
  buildSponsorSalesWhatsAppUrl,
  shouldBlockSelfServeSponsorCheckout,
} from "@/lib/domain/organization-sales";
import { getCurrentProfile, parseOrganizationType } from "@/lib/domain/profiles";
import {
  activateSponsorBoost,
  createSponsorBoostCheckoutSession,
} from "@/lib/domain/sponsor-activation";
import { getSponsorPricingOptions } from "@/lib/domain/sponsored-pricing";
import { createClient } from "@/lib/supabase/server";

const sponsorCheckoutSchema = z.object({
  packageDays: z.union([z.literal(7), z.literal(30)]),
  headline: z.string().trim().min(3).max(120).optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
    }

    if (profile.role !== "teacher") {
      return NextResponse.json(
        {
          error:
            "Sponsorlu reklam vermek için öğretmen, kurum veya platform profiline sahip olmalısınız.",
        },
        { status: 403 },
      );
    }

    const body = sponsorCheckoutSchema.parse(await request.json().catch(() => ({})));
    const options = getSponsorPricingOptions(profile);
    const selectedOption = options.find((opt) => opt.days === body.packageDays);

    if (!selectedOption) {
      return NextResponse.json({ error: "Geçersiz sponsorluk paketi süresi." }, { status: 400 });
    }

    const organizationType = parseOrganizationType(profile.organization_type);

    if (canUseDevBillingBypass()) {
      const result = await activateSponsorBoost(supabase, {
        userId: profile.id,
        fullName: profile.full_name,
        packageDays: body.packageDays,
        headline: body.headline,
        priceTry: selectedOption.priceTry,
      });

      return NextResponse.json({
        data: {
          success: true,
          mode: "dev_bypass",
          packageDays: body.packageDays,
          priceTry: selectedOption.priceTry,
          expiresAt: result.expiresAt,
          message: `${selectedOption.label} başarıyla aktifleştirildi! (${selectedOption.priceTry} TL · dev)`,
        },
      });
    }

    if (shouldBlockSelfServeSponsorCheckout(organizationType)) {
      const salesUrl = buildSponsorSalesWhatsAppUrl({
        organizationType,
        organizationName: profile.full_name,
        packageLabel: selectedOption.label,
        packageDays: body.packageDays,
      });
      return NextResponse.json(
        {
          error:
            "Kurumsal sponsorluk satış ekibi üzerinden açılır. WhatsApp ile teklif alın.",
          code: "ORG_SPONSOR_SALES_ASSISTED",
          data: { salesUrl },
        },
        { status: 403 },
      );
    }

    if (!process.env.STRIPE_SECRET_KEY?.trim()) {
      return NextResponse.json(
        {
          error:
            "Ödeme henüz yapılandırılmadı. Üretimde Stripe gerekir; yerel test için ZIGO_BILLING_DEV_BYPASS=true kullanın.",
        },
        { status: 402 },
      );
    }

    const session = await createSponsorBoostCheckoutSession({
      userId: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      packageDays: body.packageDays,
      priceTry: selectedOption.priceTry,
      label: selectedOption.label,
      headline: body.headline,
    });

    return NextResponse.json({
      data: {
        success: true,
        mode: "stripe",
        checkoutUrl: session.url,
        packageDays: body.packageDays,
        priceTry: selectedOption.priceTry,
        message: "Ödeme sayfasına yönlendiriliyorsunuz…",
      },
    });
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? "Lütfen 7 veya 30 günlük geçerli bir paket seçin."
        : error instanceof Error
          ? error.message
          : "Sponsorluk işlemi tamamlanamadı.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
