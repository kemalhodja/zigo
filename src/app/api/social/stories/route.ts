import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { createStory, createStorySchema, getActiveStories } from "@/lib/domain/social";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const stories = await getActiveStories(supabase);
    return NextResponse.json({ data: stories });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stories could not be loaded.";
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

    if (profile.role !== "teacher" || !profile.is_verified) {
      return NextResponse.json({ error: "Only verified teachers can create stories." }, { status: 403 });
    }

    const body = createStorySchema.parse(await request.json());
    const story = await createStory(supabase, {
      areaId: body.areaId,
      authorId: profile.id,
      caption: body.caption,
      mediaUrl: body.mediaUrl,
    });

    return NextResponse.json({ data: story }, { status: 201 });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Choose an assigned area, keep the story caption under 500 characters, and use a valid media URL."
      : error instanceof Error
        ? error.message
        : "Story could not be created.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
