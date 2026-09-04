import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { socialPostActionSchema, toggleLike } from "@/lib/domain/social";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Beğenmek için lütfen giriş yapın." }, { status: 401 });
    }

    const body = socialPostActionSchema.parse(await request.json());
    const data = await toggleLike(supabase, {
      postId: body.postId,
      userId: profile.id,
    });

    return NextResponse.json({ data, meta: { action: "toggle-like" } });
  } catch (error) {
    console.error("[SOCIAL_LIKE_ERROR]", error);
    const message = error instanceof z.ZodError
      ? "Lütfen beğenmek için geçerli bir gönderi seçin."
      : error instanceof Error
        ? error.message
        : "Beğeni işlemi tamamlanamadı. Lütfen tekrar deneyin.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
