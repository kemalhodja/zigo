import { NextResponse } from "next/server";
import { z } from "zod";

import { requirePlatformAdmin } from "@/lib/domain/admin-auth";

const broadcastSchema = z.object({
  targetRole: z.enum(["all", "student", "teacher", "parent"]),
  title: z.string().trim().min(2).max(100),
  body: z.string().trim().min(5).max(1000),
});

export async function POST(request: Request) {
  try {
    const auth = await requirePlatformAdmin();
    if ("error" in auth) return auth.error;

    const payload = broadcastSchema.parse(await request.json());

    // Query target user IDs based on role
    let query = auth.supabase.from("users").select("id");
    if (payload.targetRole !== "all") {
      query = query.eq("role", payload.targetRole);
    }

    const { data: targetUsers, error: fetchError } = await query;
    if (fetchError || !targetUsers || targetUsers.length === 0) {
      return NextResponse.json({ error: "Hedef kitlede kullanıcı bulunamadı." }, { status: 400 });
    }

    const fullMessage = `📣 ${payload.title}\n${payload.body}`;

    const notifications = targetUsers.map((user) => ({
      user_id: user.id,
      actor_id: auth.profile.id,
      kind: "system" as const,
      message: fullMessage,
    }));

    const { error: insertError } = await auth.supabase.from("notifications").insert(notifications);
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    return NextResponse.json({
      data: {
        sentCount: targetUsers.length,
        targetRole: payload.targetRole,
      },
    });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Lütfen geçerli başlık, mesaj ve hedef kitle seçin."
      : error instanceof Error
        ? error.message
        : "Toplu duyuru gönderilemedi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
