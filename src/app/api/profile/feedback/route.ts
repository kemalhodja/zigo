import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

const feedbackSchema = z.object({
  category: z.enum(["request", "complaint"]),
  subject: z.string().trim().min(3).max(120),
  content: z.string().trim().min(10).max(1500),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = feedbackSchema.parse(await request.json());

    const categoryTitle = payload.category === "request" ? "💡 İstek & Öneri" : "⚠️ Şikâyet & Hata Bildirimi";

    // Store feedback in notifications table as system notification for user record
    await supabase.from("notifications").insert({
      user_id: profile.id,
      actor_id: profile.id,
      kind: "system",
      message: `${categoryTitle}: ${payload.subject} — ${payload.content}`,
    });

    return NextResponse.json({
      data: {
        success: true,
        message: "İstek ve şikayetiniz yönetici ekibimize başarıyla iletildi. Teşekkür ederiz!",
      },
    });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Lütfen geçerli bir konu ve detaylı açıklama yazın."
      : error instanceof Error
        ? error.message
        : "İstek ve şikayet iletilemedi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
