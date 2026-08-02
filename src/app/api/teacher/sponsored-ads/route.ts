import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { listTeacherSponsoredAds } from "@/lib/domain/sponsored-ads";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "UNAUTHORIZED", code: "UNAUTHORIZED" }, { status: 401 });
    }

    if (profile.role !== "teacher") {
      return NextResponse.json({ error: "TEACHER_ONLY", code: "TEACHER_ONLY" }, { status: 403 });
    }

    const rawLimit = Number(new URL(request.url).searchParams.get("limit") ?? 20);
    const limit = Number.isFinite(rawLimit) ? Math.min(50, Math.max(1, rawLimit)) : 20;
    const ads = await listTeacherSponsoredAds(supabase, profile.id, limit);

    return NextResponse.json({ data: ads, meta: { count: ads.length, limit } });
  } catch {
    return NextResponse.json({ error: "LOAD_FAILED", code: "LOAD_FAILED" }, { status: 400 });
  }
}
