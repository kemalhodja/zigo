/**
 * POST /api/ads/watch
 *
 * Processes a watched rewarded ad and grants ad-free time for the signed-in user.
 * Body: { hoursToAdd? }
 */

import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { grantAdFreeTime } from "@/lib/server/ad-state-manager";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as { hoursToAdd?: number };
    const hoursToAdd = typeof body.hoursToAdd === "number" ? body.hoursToAdd : 2;
    const result = await grantAdFreeTime(profile.id, hoursToAdd);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to process ad watch" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      adFreeUntil: result.adFreeUntil,
      hoursGranted: result.hoursGranted,
    });
  } catch (error) {
    console.error("Error processing ad watch:", error);
    return NextResponse.json({ error: "Failed to process ad watch" }, { status: 500 });
  }
}
