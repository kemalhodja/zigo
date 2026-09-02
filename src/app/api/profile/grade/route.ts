import { NextResponse } from "next/server";
import { z } from "zod";

import { respondWithDomainError } from "@/lib/domain/api-errors";
import {
  applyAutoInterestsForGrade,
  getCurrentProfile,
  updateUserGradeLevel,
} from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (profile.role !== "student" && profile.role !== "parent") {
      return NextResponse.json(
        { error: "Only student and parent accounts can update grade level." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const updated = await updateUserGradeLevel(supabase, { gradeLevel: body.gradeLevel });
    const autoInterests = await applyAutoInterestsForGrade(supabase, body.gradeLevel);

    return NextResponse.json({
      data: updated,
      autoAssigned: autoInterests.autoAssigned,
      areaIds: autoInterests.areaIds,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Choose a valid grade level.", details: error.issues }, { status: 400 });
    }

    return respondWithDomainError(error, "Grade level could not be updated.");
  }
}
