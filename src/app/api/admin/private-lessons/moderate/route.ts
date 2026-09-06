import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  postId: z.string().uuid(),
  status: z.enum(["open", "rejected", "closed"]),
  note: z.string().trim().max(1_000).optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile) return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
    const body = schema.parse(await request.json());
    const rpc = supabase.rpc as unknown as (name: string, args: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    const { error } = await rpc("moderate_private_lesson_post", {
      target_post_id: body.postId,
      next_status: body.status,
      note: body.note ?? null,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 403 });
    return NextResponse.json({ data: { moderated: true } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof z.ZodError ? "Geçersiz moderasyon isteği." : "İlan incelenemedi." }, { status: 400 });
  }
}
