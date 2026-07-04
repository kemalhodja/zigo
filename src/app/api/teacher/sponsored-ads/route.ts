import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { listTeacherSponsoredAds } from "@/lib/domain/sponsored-ads";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (profile.role !== "teacher") {
      return NextResponse.json({ error: "Only teachers can manage sponsored ads." }, { status: 403 });
    }

    const rawLimit = Number(new URL(request.url).searchParams.get("limit") ?? 20);
    const limit = Number.isFinite(rawLimit) ? Math.min(50, Math.max(1, rawLimit)) : 20;
    const ads = await listTeacherSponsoredAds(supabase, limit);

    return NextResponse.json({ data: ads, meta: { count: ads.length, limit } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sponsored ads could not be loaded.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
