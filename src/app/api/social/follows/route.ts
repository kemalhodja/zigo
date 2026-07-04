import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { followSchema, toggleFollow } from "@/lib/domain/social";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = followSchema.parse(await request.json());
    const data = await toggleFollow(supabase, {
      followerId: profile.id,
      followingId: body.followingId,
    });

    return NextResponse.json({ data, meta: { action: "toggle-follow" } });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Choose a valid creator profile to follow."
      : error instanceof Error
        ? error.message
        : "Follow action failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
