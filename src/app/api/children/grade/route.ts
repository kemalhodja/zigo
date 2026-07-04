import { NextResponse } from "next/server";
import { z } from "zod";

import { updateChildGradeLevel } from "@/lib/domain/children";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (profile.role !== "parent") {
      return NextResponse.json({ error: "Only parents can update child grade level." }, { status: 403 });
    }

    const body = await request.json();
    const updated = await updateChildGradeLevel(supabase, {
      childProfileId: body.childProfileId,
      gradeLevel: body.gradeLevel,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Choose a valid child profile and grade level."
      : error instanceof Error
        ? error.message
        : "Child grade level could not be updated.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
