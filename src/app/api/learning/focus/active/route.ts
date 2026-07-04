import { NextResponse } from "next/server";

import { getActiveFocusSession } from "@/lib/domain/focus-analytics";
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
      return NextResponse.json({ data: null });
    }

    const data = await getActiveFocusSession(supabase);
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Active focus session could not be loaded.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
