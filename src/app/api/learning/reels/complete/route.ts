import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { completeReelWatch } from "@/lib/domain/social";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = await completeReelWatch(supabase, {
      postId: body.postId,
      secondsWatched: body.secondsWatched,
      userId: profile.id,
    });

    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Watch at least 60 seconds of a valid reel or video lesson."
      : error instanceof Error
        ? error.message
        : "Learning event could not be completed.";
    return NextResponse.json(
      { error: message },
      { status: 400 },
    );
  }
}
