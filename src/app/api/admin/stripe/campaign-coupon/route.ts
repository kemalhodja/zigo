import { NextResponse } from "next/server";

import { requirePlatformAdmin } from "@/lib/domain/admin-auth";
import {
  ensureStripeCampaignCoupon,
  getStripeCampaignProvisionStatus,
} from "@/lib/domain/stripe-campaign-provision";

export async function GET() {
  const auth = await requirePlatformAdmin();
  if (auth.error) return auth.error;

  return NextResponse.json({ data: getStripeCampaignProvisionStatus() });
}

export async function POST() {
  const auth = await requirePlatformAdmin();
  if (auth.error) return auth.error;

  try {
    const result = await ensureStripeCampaignCoupon();
    return NextResponse.json({
      data: {
        ...result,
        status: getStripeCampaignProvisionStatus(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stripe kampanya kuponu oluşturulamadı.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
