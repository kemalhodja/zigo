import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { startFocusSession, startFocusSessionSchema } from "@/lib/domain/study-moments";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = startFocusSessionSchema.parse(await request.json());

    if (profile.role === "parent") {
      if (!body.childProfileId) {
        return NextResponse.json(
          { error: "Parents must pass childProfileId for supervised focus." },
          { status: 400 },
        );
      }
    } else if (profile.role === "student") {
      if (body.childProfileId) {
        return NextResponse.json({ error: "Students cannot start child focus sessions." }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: "Only students and parents can start focus sessions." }, { status: 403 });
    }

    const data = await startFocusSession(supabase, body);
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Focus session could not be started.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
