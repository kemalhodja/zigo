import { NextResponse } from "next/server";
import { z } from "zod";

import { RateLimitExceededError, respondWithDomainError } from "@/lib/domain/api-errors";
import {
  createLessonRequest,
  getLessonRequestsForUser,
} from "@/lib/domain/lesson-requests";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (profile.role === "student") {
      return NextResponse.json(
        { error: "Students cannot access professional lesson requests." },
        { status: 403 },
      );
    }

    const data = await getLessonRequestsForUser(supabase, profile.id);
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lesson requests could not be loaded.";
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

    if (profile.role !== "parent") {
      return NextResponse.json(
        { error: "Only parents can create lesson requests." },
        { status: 403 },
      );
    }

    const rateLimit = checkRateLimit(`lesson-request:${profile.id}`, 6, 60 * 60_000);
    if (!rateLimit.allowed) {
      throw new RateLimitExceededError(
        "Çok fazla ders talebi gönderdin. Bir süre bekleyip tekrar dene.",
        rateLimit.retryAfterSeconds,
      );
    }

    const body = await request.json();
    const created = await createLessonRequest(supabase, {
      senderId: profile.id,
      receiverId: body.receiverId,
      childProfileId: body.childProfileId,
      areaId: body.areaId ? Number(body.areaId) : undefined,
      messageBody: body.messageBody,
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Geçerli bir öğretmen seç ve en az 10 karakterlik bir talep mesajı yaz." },
        { status: 400 },
      );
    }

    return respondWithDomainError(error, "Lesson request could not be created.");
  }
}
