import { NextResponse } from "next/server";
import { z } from "zod";

import { updateAvatarAssets } from "@/lib/domain/gamification";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (profile.role !== "student") {
      return NextResponse.json({ error: "Only students can customize avatars." }, { status: 403 });
    }

    const body = await request.json();
    const result = await updateAvatarAssets(supabase, {
      studentId: profile.id,
      assets: body.assets,
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Choose valid avatar assets."
      : error instanceof Error
        ? error.message
        : "Avatar could not be updated.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
