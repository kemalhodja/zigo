import { NextResponse } from "next/server";
import { z } from "zod";

import { RateLimitExceededError, respondWithDomainError } from "@/lib/domain/api-errors";
import { getCurrentProfile, getUserInterestAreaIds } from "@/lib/domain/profiles";
import { createQuestion, getMatchedQuestions } from "@/lib/domain/questions";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const questions = await getMatchedQuestions(supabase, profile.id);
    return NextResponse.json({ data: questions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Questions could not be loaded.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (profile.role === "teacher") {
      return NextResponse.json({ error: "Teachers answer questions instead of asking them." }, { status: 403 });
    }

    const rateLimit = checkRateLimit(`question:${profile.id}`, 8, 60 * 60_000);
    if (!rateLimit.allowed) {
      throw new RateLimitExceededError(
        "Çok fazla soru gönderdin. Bir süre bekleyip tekrar dene.",
        rateLimit.retryAfterSeconds,
      );
    }

    const body = await request.json();
    const areaId = Number(body.areaId);
    const areaIds = await getUserInterestAreaIds(supabase, profile.id);

    if (!areaIds.includes(areaId)) {
      return NextResponse.json(
        { error: "Questions can only be asked in your selected education areas." },
        { status: 403 },
      );
    }

    const question = await createQuestion(supabase, {
      authorId: profile.id,
      areaId,
      title: body.title,
      description: body.description,
    });

    return NextResponse.json({ data: question }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error:
            "Choose a valid education area, add a title of at least 3 characters and details of at least 10 characters.",
        },
        { status: 400 },
      );
    }

    return respondWithDomainError(error, "Question could not be created.");
  }
}
