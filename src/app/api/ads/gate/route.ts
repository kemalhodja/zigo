/**
 * GET /api/ads/gate
 *
 * Checks if the signed-in user can proceed with a gated action.
 */

import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { checkAdGate } from "@/lib/server/ad-state-manager";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const gateResult = await checkAdGate(profile.id);
    return NextResponse.json(gateResult);
  } catch (error) {
    console.error("Error checking ad gate:", error);
    return NextResponse.json({ error: "Failed to check ad gate" }, { status: 500 });
  }
}
