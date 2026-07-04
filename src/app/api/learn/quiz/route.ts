import { NextResponse } from "next/server";
import { z } from "zod";

import { respondWithDomainError } from "@/lib/domain/api-errors";
import { submitQuizAttempt } from "@/lib/domain/learning";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (profile.role === "teacher") {
      return NextResponse.json({ error: "Teachers cannot earn student quiz rewards." }, { status: 403 });
    }

    const body = await request.json();

    if (profile.role === "parent" && !body.childProfileId) {
      return NextResponse.json({ error: "Parent quiz attempts require a child profile." }, { status: 400 });
    }

    const attempt = await submitQuizAttempt(supabase, {
      quizId: body.quizId,
      selectedOption: body.selectedOption,
      answers: body.answers,
      childProfileId: profile.role === "parent" ? body.childProfileId : undefined,
    });

    return NextResponse.json({ data: attempt }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Choose a valid quiz and answer option." }, { status: 400 });
    }

    return respondWithDomainError(error, "Quiz attempt could not be saved.");
  }
}
