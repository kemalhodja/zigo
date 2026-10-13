import { NextResponse } from "next/server";

import { respondWithDomainError } from "@/lib/domain/api-errors";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { toSolvePayload, type UserQuizQuestion } from "@/lib/domain/user-quizzes";
import { getClientIp } from "@/lib/server/client-ip";
import { captureServerEvent } from "@/lib/server/analytics";
import { checkRateLimitAsync } from "@/lib/server/rate-limit";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json({ error: "Geçersiz quiz." }, { status: 400 });
    }

    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    // Architecture: Rate limiting defense against bots and scraper flood
    const rateLimitKey = profile
      ? `quiz-solve:${profile.id}`
      : `quiz-solve-guest:${getClientIp(_request)}`;
    const limitMax = profile ? 60 : 20;
    const rateLimit = await checkRateLimitAsync(rateLimitKey, limitMax, 60_000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Çok fazla istek gönderildi. Lütfen bir süre bekleyin." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
      );
    }

    const { data: quiz } = await supabase
      .from("user_quizzes")
      .select("id, title, description, questions, status, creator_id")
      .eq("id", id)
      .maybeSingle();

    if (!quiz || (quiz.status !== "approved" && quiz.creator_id !== profile?.id)) {
      return NextResponse.json({ error: "Quiz bulunamadı." }, { status: 404 });
    }

    if (profile) {
      void captureServerEvent(profile.id, "ugc_quiz_solved", { quiz_id: id });
    }

    await supabase.rpc("increment_user_quiz_play_count", { p_quiz_id: id }).then(({ error }) => {
      // RPC may not exist yet in older bundles — play count is best-effort.
      if (error) console.warn("[user-quizzes] play_count increment failed:", error.message);
    });

    const questions = (quiz.questions ?? []) as UserQuizQuestion[];
    return NextResponse.json({
      data: toSolvePayload({
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        questions,
      }),
    });
  } catch (error) {
    return respondWithDomainError(error, "Quiz yüklenemedi.");
  }
}
