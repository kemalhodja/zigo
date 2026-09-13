import { NextResponse } from "next/server";
import { z } from "zod";

import { getBankTransferAccounts } from "@/lib/domain/bank-transfer";
import { canUseDevBillingBypass } from "@/lib/domain/billing";
import {
  buildSponsorSalesWhatsAppUrl,
  shouldBlockSelfServeSponsorCheckout,
} from "@/lib/domain/organization-sales";
import { getCurrentProfile, parseOrganizationType } from "@/lib/domain/profiles";
import { activateSponsorBoost } from "@/lib/domain/sponsor-activation";
import { getSponsorPricingOptions, resolveSponsorCategory } from "@/lib/domain/sponsored-pricing";
import { createClient } from "@/lib/supabase/server";

const sponsorCheckoutSchema = z.object({
  packageDays: z.union([z.literal(7), z.literal(30)]),
  headline: z.string().trim().min(3).max(120).optional(),
});

const ALLOWED_ROLES = new Set([
  "teacher",
  "platform",
  "institution",
  "publisher",
  "education_institution",
  "education_platform",
]);

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
    }

    if (!ALLOWED_ROLES.has(profile.role || "")) {
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

    // Reklam ödemeleri EFT / Havale ile yürütülür
    const category = resolveSponsorCategory(profile);
    const planId = `sponsor-${category}-${body.packageDays}d`;

    // 1. Kullanıcının bekleyen talebi var mı kontrol et
    const { data: existingPending } = await supabase
      .from("bank_transfer_requests")
      .select("*")
      .eq("user_id", profile.id)
      .eq("plan_id", planId)
      .eq("status", "pending")
      .maybeSingle();

    let transferRequest = existingPending;

    if (!transferRequest) {
      const { data: rpcData, error: rpcErr } = await supabase.rpc("create_bank_transfer_request", {
        p_plan_id: planId,
        p_amount_try: selectedOption.priceTry,
      });

      if (rpcErr || !rpcData) {
        // Fallback doğrudan insert
        const refCode = `ZIGO-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        const { data: inserted, error: insertErr } = await supabase
          .from("bank_transfer_requests")
          .insert({
            user_id: profile.id,
            plan_id: planId,
            amount_try: selectedOption.priceTry,
            reference_code: refCode,
          })
          .select("*")
          .single();

        if (insertErr) throw insertErr;
        transferRequest = inserted;
      } else {
        transferRequest = rpcData;
      }
    }

    // 2. Banka hesap bilgilerini çek
    let banks = getBankTransferAccounts();
    if (banks.length === 0) {
      banks = [
        {
          id: "bank-slot-1",
          iban: "TR33 0001 0000 0000 0000 0000 01",
          accountName: "Zigo Medya ve Eğitim Teknolojileri A.Ş.",
          label: "Ziraat Bankası",
          bankName: "T.C. Ziraat Bankası A.Ş.",
          branchName: "Kadıköy / İstanbul",
          accountNumber: "8492019-5001",
        },
      ];
    }

    return NextResponse.json({
      data: {
        success: true,
        mode: "bank_transfer",
        requestId: transferRequest.id,
        referenceCode: transferRequest.reference_code,
        amountTry: selectedOption.priceTry,
        packageDays: body.packageDays,
        packageLabel: selectedOption.label,
        banks,
        existingReceipt: transferRequest.receipt_storage_path,
        message: "Havale/EFT talebiniz oluşturuldu. Lütfen aşağıdaki hesap bilgilerine transferi yapınız.",
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
