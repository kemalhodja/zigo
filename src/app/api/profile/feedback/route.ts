import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { checkRateLimitAsync } from "@/lib/server/rate-limit";
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

    const rateLimit = await checkRateLimitAsync(`profile-feedback:${profile.id}`, 5, 60 * 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Saatlik geri bildirim limitine ulaştın. Lütfen daha sonra tekrar dene." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
      );
    }

    const payload = feedbackSchema.parse(await request.json());

    const feedbackTable = supabase.from as unknown as (table: string) => {
      insert: (row: Record<string, unknown>) => Promise<{ error: Error | null }>;
    };
    const { error } = await feedbackTable("user_feedback").insert({
      user_id: profile.id,
      category: payload.category,
      subject: payload.subject,
      content: payload.content,
    });

    if (error) {
      console.warn("user_feedback insert notice:", error.message);
      if ((error as { code?: string }).code !== "PGRST205") {
        throw error;
      }
    }

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
