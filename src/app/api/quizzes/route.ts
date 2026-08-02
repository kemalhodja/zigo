import { NextResponse } from "next/server";
import { z } from "zod";

import { respondWithDomainError } from "@/lib/domain/api-errors";
import { createTeacherQuiz } from "@/lib/domain/learning";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { getUserSubscription } from "@/lib/domain/subscription";
import { assertTeacherCreatorPlus } from "@/lib/domain/teacher-creator-plus";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (profile.role !== "teacher" || !profile.is_verified) {
      return NextResponse.json({ error: "Only verified teachers can create quizzes." }, { status: 403 });
    }

    const subscription = await getUserSubscription(supabase, profile.id);
    assertTeacherCreatorPlus(subscription, profile.role, "quiz oluşturma");

    const body = await request.json();
    const quiz = await createTeacherQuiz(supabase, {
      teacherId: profile.id,
      areaId: body.areaId,
      title: body.title,
      questions: body.questions,
      pointsReward: body.pointsReward,
    });

    return NextResponse.json({ data: quiz }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error:
            "10 soruluk quiz için başlık, alan ve her soruda 4 benzersiz seçenek ile doğru cevap gerekli.",
        },
        { status: 400 },
      );
    }

    return respondWithDomainError(error, "Quiz could not be created.");
  }
}
