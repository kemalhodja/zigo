import { NextResponse } from "next/server";
import { z } from "zod";

import { RateLimitExceededError, respondWithDomainError } from "@/lib/domain/api-errors";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createStoryReply } from "@/lib/domain/social";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = checkRateLimit(`story-reply:${profile.id}`, 10, 60_000);
    if (!rateLimit.allowed) {
      throw new RateLimitExceededError(
        `Too many replies. Try again in ${rateLimit.retryAfterSeconds} seconds.`,
        rateLimit.retryAfterSeconds,
      );
    }

    const body = await request.json();
    const reply = await createStoryReply(supabase, {
      storyId: body.storyId,
      userId: profile.id,
      userRole: profile.role,
      content: body.content,
    });

    return NextResponse.json({ data: reply }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Reply must be between 1 and 1000 characters for a valid story." },
        { status: 400 },
      );
    }

    return respondWithDomainError(error, "Reply could not be sent.");
  }
}
