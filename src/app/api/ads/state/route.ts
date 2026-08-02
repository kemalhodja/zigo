/**
 * GET /api/ads/state
 *
 * Returns ad-free state for the signed-in user.
 */

import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { isUserAdFree } from "@/lib/server/ad-state-manager";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adState = await isUserAdFree(profile.id);
    return NextResponse.json(adState);
  } catch (error) {
    console.error("Error fetching ad state:", error);
    return NextResponse.json({ error: "Failed to fetch ad state" }, { status: 500 });
  }
}
