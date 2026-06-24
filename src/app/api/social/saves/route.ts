import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { socialPostActionSchema, toggleSave } from "@/lib/domain/social";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = socialPostActionSchema.parse(await request.json());
    const data = await toggleSave(supabase, {
      postId: body.postId,
      userId: profile.id,
    });

    return NextResponse.json({ data, meta: { action: "toggle-save" } });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Choose a valid post to save."
      : error instanceof Error
        ? error.message
        : "Save action failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
