import { NextResponse } from "next/server";

import { getVerifiedTeachersForParentLessonRequest } from "@/lib/domain/lesson-requests";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (profile.role !== "parent") {
      return NextResponse.json({ error: "Only parents can browse lesson request teachers." }, { status: 403 });
    }

    const data = await getVerifiedTeachersForParentLessonRequest(supabase, profile.id);
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Teachers could not be loaded.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
