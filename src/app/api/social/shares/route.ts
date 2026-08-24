import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { sharePost, socialPostActionSchema } from "@/lib/domain/social";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Paylaşmak için lütfen giriş yapın." }, { status: 401 });
    }

    const body = socialPostActionSchema.parse(await request.json());
    const data = await sharePost(supabase, {
      postId: body.postId,
      userId: profile.id,
    });

    return NextResponse.json({ data, meta: { action: "share" } });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Lütfen paylaşmak için geçerli bir gönderi seçin."
      : error instanceof Error
        ? error.message
        : "Paylaşım işlemi tamamlanamadı. Lütfen tekrar deneyin.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
