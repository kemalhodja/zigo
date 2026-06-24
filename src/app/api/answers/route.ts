import { NextResponse } from "next/server";
import { z } from "zod";

import { respondWithDomainError } from "@/lib/domain/api-errors";
import { getCurrentProfile, getUserInterestAreaIds } from "@/lib/domain/profiles";
import { createTeacherAnswer } from "@/lib/domain/questions";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (profile.role !== "teacher" || !profile.is_verified) {
      return NextResponse.json({ error: "Only verified teachers can answer questions." }, { status: 403 });
    }

    const body = await request.json();
    const { data: question, error: questionError } = await supabase
      .from("questions")
      .select("area_id")
      .eq("id", body.questionId)
      .maybeSingle();

    if (questionError) throw questionError;
    if (!question) {
      return NextResponse.json({ error: "Question was not found." }, { status: 404 });
    }

    const areaIds = await getUserInterestAreaIds(supabase, profile.id);
    if (!areaIds.includes(question.area_id ?? 0)) {
      return NextResponse.json(
        { error: "Teachers can answer only in assigned education areas." },
        { status: 403 },
      );
    }

    const answer = await createTeacherAnswer(supabase, {
      teacherId: profile.id,
      questionId: body.questionId,
      content: body.content,
    });

    return NextResponse.json({ data: answer }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Choose a valid question and write an answer of at least 10 characters." },
        { status: 400 },
      );
    }

    return respondWithDomainError(error, "Answer could not be created.");
  }
}
