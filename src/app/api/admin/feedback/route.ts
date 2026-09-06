import { NextResponse } from "next/server";
import { z } from "zod";

import { requirePlatformAdmin } from "@/lib/domain/admin-auth";

const updateFeedbackSchema = z.object({
  feedbackId: z.string().uuid(),
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
  adminNote: z.string().trim().max(1000).nullable().optional(),
});

export async function PATCH(request: Request) {
  try {
    const auth = await requirePlatformAdmin();
    if ("error" in auth) return auth.error;

    const body = updateFeedbackSchema.parse(await request.json());
    const feedbackTable = auth.supabase.from as unknown as (table: string) => {
      update: (values: Record<string, unknown>) => {
        eq: (column: string, value: string) => Promise<{ error: Error | null }>;
      };
    };
    const { error } = await feedbackTable("user_feedback")
      .update({
        status: body.status,
        admin_note: body.adminNote ?? null,
        resolved_at: body.status === "resolved" || body.status === "closed" ? new Date().toISOString() : null,
      })
      .eq("id", body.feedbackId);

    if (error) throw error;
    return NextResponse.json({ data: { updated: true } });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Geçerli bir geri bildirim ve durum seçin."
      : error instanceof Error
        ? error.message
        : "Geri bildirim durumu güncellenemedi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
