import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { completeFocusSession, completeFocusSessionSchema } from "@/lib/domain/study-moments";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (profile.role !== "student" && profile.role !== "parent") {
      return NextResponse.json({ error: "Only students and parents can complete focus sessions." }, { status: 403 });
    }

    const body = completeFocusSessionSchema.parse(await request.json());
    const data = await completeFocusSession(supabase, body);
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Focus session could not be completed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
