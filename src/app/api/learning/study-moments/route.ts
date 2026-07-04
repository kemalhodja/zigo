import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { getMatchedStudyMoments } from "@/lib/domain/study-moments";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await getMatchedStudyMoments(supabase);
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Study moments could not be loaded.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
