import { NextResponse } from "next/server";
import { z } from "zod";

import { requirePlatformAdmin } from "@/lib/domain/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const toggleVisibilitySchema = z.object({
  postId: z.string().uuid(),
  isHidden: z.boolean(),
});

export async function POST(request: Request) {
  try {
    const auth = await requirePlatformAdmin();
    if ("error" in auth) {
      return auth.error;
    }

    const body = toggleVisibilitySchema.parse(await request.json().catch(() => ({})));
    const adminClient = createAdminClient() ?? auth.supabase;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (adminClient as any)
      .from("social_posts")
      .update({ is_hidden: body.isHidden })
      .eq("id", body.postId);

    if (error) {
      return NextResponse.json({ error: error.message || "Gönderi durumu güncellenemedi." }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      postId: body.postId,
      isHidden: body.isHidden,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Geçersiz istek parametreleri." }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Gönderi güncellenemedi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
