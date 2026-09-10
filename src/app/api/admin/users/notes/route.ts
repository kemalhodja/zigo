import { NextResponse } from "next/server";
import { z } from "zod";

import { requirePlatformAdmin } from "@/lib/domain/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const addNoteSchema = z.object({
  userId: z.string().uuid(),
  note: z.string().min(1).max(2000),
  tags: z.array(z.string().max(50)).optional().default([]),
});

export async function POST(request: Request) {
  try {
    const auth = await requirePlatformAdmin();
    if ("error" in auth) {
      return auth.error;
    }

    const body = addNoteSchema.parse(await request.json().catch(() => ({})));
    const adminClient = createAdminClient() ?? auth.supabase;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (adminClient as any)
      .from("user_admin_notes")
      .insert({
        user_id: body.userId,
        admin_id: auth.profile.id,
        note: body.note,
        tags: body.tags,
      })
      .select("*")
      .single();

    if (error) {
      console.error("[ADMIN_NOTE_INSERT_ERROR]", error);
      return NextResponse.json({ error: error.message || "Not kaydedilemedi." }, { status: 400 });
    }

    return NextResponse.json({ success: true, note: data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Geçersiz not verisi." }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Not eklenemedi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
