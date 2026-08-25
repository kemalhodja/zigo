import { NextResponse } from "next/server";
import { z } from "zod";

import { respondWithDomainError } from "@/lib/domain/api-errors";
import { getCurrentProfile } from "@/lib/domain/profiles";
import type { UserQuizQuestion } from "@/lib/domain/user-quizzes";
import { captureServerEvent } from "@/lib/server/analytics";
import { createClient } from "@/lib/supabase/server";

const gradeSchema = z.object({
  answers: z.array(z.number().int().min(-1).max(3)).min(1).max(10),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json({ error: "Geçersiz quiz." }, { status: 400 });
    }

    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = gradeSchema.parse(await request.json().catch(() => ({})));

    const { data: quiz } = await supabase
      .from("user_quizzes")
      .select("id, questions, status, creator_id")
      .eq("id", id)
      .maybeSingle();

    if (!quiz || (quiz.status !== "approved" && quiz.creator_id !== profile.id)) {
      return NextResponse.json({ error: "Quiz bulunamadı." }, { status: 404 });
    }

    const questions = (quiz.questions ?? []) as UserQuizQuestion[];
    const results = questions.map((q, i) => ({
      correctIndex: q.correctIndex,
      givenIndex: body.answers[i] ?? -1,
      isCorrect: q.correctIndex === (body.answers[i] ?? -1),
    }));
    const correct = results.filter((r) => r.isCorrect).length;

    void captureServerEvent(profile.id, "ugc_quiz_graded", {
      quiz_id: id,
      total: questions.length,
      correct,
    });

    return NextResponse.json({
      data: {
        correct,
        total: questions.length,
        score: correct * 10,
        results: results.map((r) => ({ correctIndex: r.correctIndex })),
      },
    });
  } catch (error) {
    return respondWithDomainError(error, "Değerlendirme başarısız.");
  }
}
