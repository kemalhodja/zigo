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
import { shouldBlockSelfServeOrgCheckout } from "@/lib/domain/organization-sales";
import { getCurrentProfile, parseOrganizationType } from "@/lib/domain/profiles";
import { getServerLocale, getServerMessages } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const messages = await getServerMessages();
  const h = messages.billingUi.havale;

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
    const message = error instanceof Error ? error.message : h.apiLoadFailed;
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const locale = await getServerLocale();
  const messages = await getServerMessages();
  const h = messages.billingUi.havale;

  try {
    if (!hasBankTransferConfigured()) {
      return NextResponse.json({ error: h.apiNotConfigured }, { status: 503 });
    }

    if (!isWebCheckoutAllowedForRequest(request)) {
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

    const body = createBankTransferSchema.parse(await request.json());
    resolveBankTransferPlan(body.planId);

    if (shouldBlockSelfServeOrgCheckout(parseOrganizationType(profile.organization_type), body.planId)) {
      return NextResponse.json(
        {
          error: h.apiOrgBlocked,
          code: "ORG_SALES_ASSISTED",
        },
        { status: 403 },
      );
    }

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
      return NextResponse.json({ error: h.apiInvalidRequest }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : h.apiCreateFailed;
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
