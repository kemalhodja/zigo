import { NextResponse } from "next/server";

import { getStudentFocusAnalytics } from "@/lib/domain/focus-analytics";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (profile.role !== "student") {
      return NextResponse.json({ error: "Student analytics only." }, { status: 403 });
    }

    const data = await getStudentFocusAnalytics(supabase);
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Focus analytics could not be loaded.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
