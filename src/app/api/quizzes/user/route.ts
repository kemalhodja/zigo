import { NextResponse } from "next/server";
import { z } from "zod";

import { respondWithDomainError } from "@/lib/domain/api-errors";
import { getCurrentProfile } from "@/lib/domain/profiles";
import {
  createUserQuiz,
  listApprovedUserQuizzes,
  listOwnUserQuizzes,
  userQuizSchema,
} from "@/lib/domain/user-quizzes";
import { captureServerEvent } from "@/lib/server/analytics";
import { createClient } from "@/lib/supabase/server";

const listQuerySchema = z.object({
  mine: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const parsed = listQuerySchema.safeParse(Object.fromEntries(url.searchParams));
    if (parsed.success && parsed.data.mine === "1") {
      const quizzes = await listOwnUserQuizzes(supabase, profile.id);
      return NextResponse.json({ data: { quizzes, scope: "mine" } });
    }

    const quizzes = await listApprovedUserQuizzes(supabase);
    return NextResponse.json({ data: { quizzes, scope: "approved" } });
  } catch (error) {
    return respondWithDomainError(error, "Quizler alınamadı.");
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (profile.role !== "student" && profile.role !== "teacher") {
      return NextResponse.json(
        { error: "Quiz yalnızca öğrenci ve öğretmen hesapları tarafından oluşturulabilir." },
        { status: 403 },
      );
    }

    const body = userQuizSchema.parse(await request.json().catch(() => ({})));
    // Moderation policy mirrors social posts: students go to the pending queue,
    // verified teachers publish instantly.
    const autoApprove = profile.role === "teacher" && profile.is_verified === true;

    const result = await createUserQuiz(supabase, profile.id, body, { autoApprove });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    void captureServerEvent(profile.id, "ugc_quiz_created", {
      quiz_id: result.id,
      question_count: body.questions.length,
      auto_approved: autoApprove,
    });

    return NextResponse.json({
      data: { id: result.id, status: result.status },
    });
  } catch (error) {
    return respondWithDomainError(error, "Quiz oluşturulamadı.");
  }
}
