import { NextResponse } from "next/server";
import { z } from "zod";

import { RateLimitExceededError, respondWithDomainError } from "@/lib/domain/api-errors";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createComment, getPostComments } from "@/lib/domain/social";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const postId = new URL(request.url).searchParams.get("postId");
    if (!postId) {
      return NextResponse.json({ error: "postId is required." }, { status: 400 });
    }

    const comments = await getPostComments(supabase, postId);
    return NextResponse.json({ data: comments, meta: { count: comments.length } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Comments could not be loaded.";
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

    const rateLimit = checkRateLimit(`comment:${profile.id}`, 10, 60_000);
    if (!rateLimit.allowed) {
      throw new RateLimitExceededError(
        `Too many comments. Try again in ${rateLimit.retryAfterSeconds} seconds.`,
        rateLimit.retryAfterSeconds,
      );
    }

    const body = await request.json();
    const comment = await createComment(supabase, {
      postId: body.postId,
      userId: profile.id,
      userRole: profile.role,
      content: body.content,
    });

    return NextResponse.json({ data: comment, meta: { action: "create-comment" } }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Comment must be between 1 and 1000 characters for a valid post." },
        { status: 400 },
      );
    }

    return respondWithDomainError(error, "Comment could not be posted.");
  }
}
