import { NextResponse } from "next/server";
import { z } from "zod";

import { adminUpdateSubscriptionTier } from "@/lib/domain/admin";
import { requirePlatformAdmin } from "@/lib/domain/admin-auth";

const adminUpdateSubscriptionTierBody = z.object({
  userId: z.string().uuid(),
  tier: z.enum(["free", "zigo_plus"]),
});

export async function POST(request: Request) {
  try {
    const auth = await requirePlatformAdmin();
    if ("error" in auth) return auth.error;

    const body = adminUpdateSubscriptionTierBody.parse(await request.json().catch(() => ({})));
    await adminUpdateSubscriptionTier(auth.supabase, {
      userId: body.userId,
      tier: body.tier,
    });

    return NextResponse.json({ success: true, tier: body.tier });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid subscription update request." }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Failed to update subscription.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
