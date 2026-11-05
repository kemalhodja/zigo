import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { getUserSubscription } from "@/lib/domain/subscription";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/subscriptions/status
 *
 * Aktif oturum açmış kullanıcının Zigo Plus abonelik durumunu döndürür.
 * Oturum açmamış ziyaretçiler veya abonesiz kullanıcılar için isSubscriber: false döner.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile) {
      return NextResponse.json({
        isSubscriber: false,
        tier: "free",
        isTrial: false,
        trialDaysRemaining: 0,
      });
    }

    const sub = await getUserSubscription(supabase, profile.id);
    return NextResponse.json({
      isSubscriber: Boolean(sub.isPremium),
      tier: sub.tier,
      isTrial: Boolean(sub.isTrial),
      trialDaysRemaining: sub.trialDaysRemaining ?? 0,
    });
  } catch (err) {
    console.error("GET /api/subscriptions/status error:", err);
    return NextResponse.json(
      { isSubscriber: false, tier: "free", isTrial: false, trialDaysRemaining: 0 },
      { status: 200 }
    );
  }
}
