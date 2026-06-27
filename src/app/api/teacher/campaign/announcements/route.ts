import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { listSponsoredTeacherCampaigns } from "@/lib/domain/teacher-campaign";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const placementParam = searchParams.get("placement");
    const placement =
      placementParam === "feed_highlight" || placementParam === "profile_rail"
        ? placementParam
        : "explore";

    const campaigns = await listSponsoredTeacherCampaigns(supabase, 8, placement);
    return NextResponse.json({ data: campaigns });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Campaigns could not be loaded.";
    console.error("[campaign/announcements]", message);
    return NextResponse.json({ data: [] });
  }
}
