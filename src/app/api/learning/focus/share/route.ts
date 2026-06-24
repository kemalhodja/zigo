import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { shareStudyMoment, shareStudyMomentSchema } from "@/lib/domain/study-moments";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (profile.role !== "student") {
      return NextResponse.json({ error: "Only students can share study moments." }, { status: 403 });
    }

    const body = shareStudyMomentSchema.parse(await request.json());
    const data = await shareStudyMoment(supabase, body);
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Study moment could not be shared.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
