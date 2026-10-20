import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { getUserSubscription } from "@/lib/domain/subscription";
import { checkRateLimitAsync } from "@/lib/server/rate-limit";
import { createClient } from "@/lib/supabase/server";

const aiQuestionRequestSchema = z.object({
  topic: z.string().trim().min(3).max(200),
  grade: z.string().trim().min(1).max(50).optional(),
  count: z.number().int().min(1).max(20).default(10),
  format: z.enum(["lgs_4", "yks_5", "true_false", "primary_3"]).default("lgs_4"),
  language: z.literal("tr").default("tr"),
});

const OPTION_COUNT: Record<string, number> = {
  lgs_4: 4,
  yks_5: 5,
  true_false: 2,
  primary_3: 3,
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowedRoles = ["teacher", "education_institution", "education_platform", "publisher"];
    if (!allowedRoles.includes(profile.role as string)) {
      return NextResponse.json({ error: "Yalnızca öğretmenler AI soru üreteci kullanabilir." }, { status: 403 });
    }

    const rateLimit = await checkRateLimitAsync(`ai-questions:${profile.id}`, 10, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "AI soru üretme limitine ulaştın. 1 dakika sonra tekrar dene.", code: "RATE_LIMITED" },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
      );
    }

    const parsed = aiQuestionRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz istek. Konu ve format zorunludur." }, { status: 400 });
    }

    const { topic, grade, count, format } = parsed.data;
    const subscription = await getUserSubscription(supabase, profile.id);
    const effectiveCount = subscription.isPremium ? count : Math.min(count, 5);
    const optCount = OPTION_COUNT[format] ?? 4;
    const isTF = format === "true_false";

    const formatDesc = isTF
      ? `Doğru/Yanlış formatında (seçenekler: ["Doğru", "Yanlış"])`
      : `${optCount} seçenekli çoktan seçmeli formatında (A, B, C${optCount >= 4 ? ", D" : ""}${optCount >= 5 ? ", E" : ""})`;

    const gradeContext = grade ? `Sınıf seviyesi: ${grade}.` : "";

    const prompt = `Sen Türkiye MEB müfredatına uygun soru hazırlayan uzman bir eğitimcisin.
Konu: "${topic}". ${gradeContext}
${formatDesc} tam olarak ${effectiveCount} adet özgün soru hazırla.

KURALLAR:
1. Her soru Türkçe olmalı.
2. Sorular gerçekçi ve pedagojik olarak doğru olmalı.
3. Şıklar net ve birbirinden farklı olmalı.
4. Doğru cevap her soruda farklı indekste (0,1,2,3) olmalı — sadece A şıkkını doğru yapma.
5. Her soru için kısa bir "explanation" (çözüm notu, 1-2 cümle) ekle.

Yanıtı SADECE aşağıdaki JSON formatında ver, başka hiçbir metin ekleme:
{
  "questions": [
    {
      "text": "Soru metni burada",
      "options": ${isTF ? '["Doğru", "Yanlış"]' : `["Seçenek A", "Seçenek B", ${optCount >= 3 ? '"Seçenek C"' : ""}${optCount >= 4 ? ', "Seçenek D"' : ""}${optCount >= 5 ? ', "Seçenek E"' : ""}]`},
      "correctIndex": 0,
      "explanation": "Kısa çözüm açıklaması"
    }
  ]
}`;

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      // Mock response for development
      const mockQuestions = Array.from({ length: effectiveCount }, (_, i) => ({
        text: `${topic} konusunda örnek soru ${i + 1}: Bu kavram hangi durumda geçerlidir?`,
        options: isTF
          ? ["Doğru", "Yanlış"]
          : Array.from({ length: optCount }, (__, j) => `Seçenek ${String.fromCharCode(65 + j)}`),
        correctIndex: i % optCount,
        explanation: `Bu sorunun doğru cevabı ${String.fromCharCode(65 + (i % optCount))} şıkkıdır. ${topic} konusunda temel bir kavramdır.`,
      }));
      return NextResponse.json({ questions: mockQuestions, generated: effectiveCount, isMock: true });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 3000,
        temperature: 0.8,
        response_format: { type: "json_object" },
        user: profile.id,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "AI servisi şu an meşgul. Lütfen tekrar dene." }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "{}";

    let questions: unknown[] = [];
    try {
      const parsed2 = JSON.parse(content);
      if (Array.isArray(parsed2.questions)) {
        questions = parsed2.questions.slice(0, effectiveCount);
      }
    } catch {
      return NextResponse.json({ error: "AI yanıtı işlenemedi. Lütfen tekrar dene." }, { status: 500 });
    }

    return NextResponse.json({ questions, generated: questions.length });
  } catch (error) {
    console.error("[AI_QUESTIONS_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
