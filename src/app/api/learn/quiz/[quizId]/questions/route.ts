import { NextResponse } from "next/server";

import { getQuizQuestionsForPlay } from "@/lib/domain/learning";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ quizId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { quizId } = await context.params;
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (profile.role === "teacher") {
      return NextResponse.json({ error: "Teachers cannot play student quiz rewards." }, { status: 403 });
    }

    const questions = await getQuizQuestionsForPlay(supabase, quizId);
    return NextResponse.json({ data: questions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Quiz questions could not be loaded.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
