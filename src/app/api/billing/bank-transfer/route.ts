import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createBankTransferRequest,
  createBankTransferSchema,
  getBankTransferAccounts,
  getBankTransferConfig,
  getUserBankTransferRequests,
  hasBankTransferConfigured,
  resolveBankTransferPlan,
} from "@/lib/domain/bank-transfer";
import { getBillingPlatformMessage, isWebCheckoutAllowedForRequest } from "@/lib/domain/billing-platform";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requests = await getUserBankTransferRequests(supabase, profile.id);
    return NextResponse.json({
      data: {
        configured: hasBankTransferConfigured(),
        bank: getBankTransferConfig(),
        banks: getBankTransferAccounts(),
        requests,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Havale talepleri yüklenemedi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    if (!hasBankTransferConfigured()) {
      return NextResponse.json(
        { error: "Havale/EFT ödemesi henüz yapılandırılmadı. ZIGO_BANK_IBAN env değerini ekleyin." },
        { status: 503 },
      );
    }

    if (!isWebCheckoutAllowedForRequest(request)) {
      return NextResponse.json(
        { error: getBillingPlatformMessage("tr"), code: "PLAY_STORE_BILLING_REQUIRED" },
        { status: 403 },
      );
    }

    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = createBankTransferSchema.parse(await request.json());
    resolveBankTransferPlan(body.planId);
    const transferRequest = await createBankTransferRequest(supabase, body.planId);

    return NextResponse.json({
      data: {
        request: transferRequest,
        bank: getBankTransferConfig(),
        banks: getBankTransferAccounts(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Geçersiz havale talebi." }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Havale talebi oluşturulamadı.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
