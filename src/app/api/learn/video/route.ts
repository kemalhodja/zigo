import { NextResponse } from "next/server";
import { z } from "zod";

import { completeVideoPost } from "@/lib/domain/learning";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (profile.role === "teacher") {
      return NextResponse.json({ error: "Teachers cannot earn student video rewards." }, { status: 403 });
    }

    const body = await request.json();

    if (profile.role === "parent" && !body.childProfileId) {
      return NextResponse.json({ error: "Parent video completion requires a child profile." }, { status: 400 });
    }

    const completion = await completeVideoPost(supabase, {
      postId: body.postId,
      secondsWatched: body.secondsWatched,
      childProfileId: profile.role === "parent" ? body.childProfileId : undefined,
    });

    return NextResponse.json({ data: completion }, { status: 201 });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Watch at least 60 seconds of a valid video lesson."
      : error instanceof Error
        ? error.message
        : "Video reward could not be saved.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
