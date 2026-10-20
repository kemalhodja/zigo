import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { getUserSubscription } from "@/lib/domain/subscription";
import { checkRateLimitAsync } from "@/lib/server/rate-limit";
import { createClient } from "@/lib/supabase/server";

const writtenExamSchema = z.object({
  schoolName: z.string().trim().max(120).default("MEB Zigo Örnek Ortaokulu / Lisesi"),
  academicYear: z.string().trim().max(30).default("2025-2026 Eğitim Öğretim Yılı"),
  grade: z.string().trim().min(1).max(50).default("8. Sınıf"),
  subject: z.string().trim().min(1).max(50).default("Matematik"),
  term: z.string().trim().min(1).max(50).default("1. Dönem 2. Yazılı (MEB Ortak Sınav)"),
  scenario: z.string().trim().max(100).default("Senaryo 1 (MEB Konu Soru Dağılım Tablosu)"),
  topics: z.string().trim().min(3).max(300),
  questionCount: z.number().int().min(3).max(12).default(6),
  durationMinutes: z.number().int().min(20).max(80).default(40),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowedRoles = ["teacher", "education_institution", "education_platform", "publisher"];
    if (!allowedRoles.includes(profile.role as string)) {
      return NextResponse.json(
        { error: "Yalnızca öğretmenler MEB açık uçlu yazılı sınavı hazırlayabilir." },
        { status: 403 }
      );
    }

    const rateLimit = await checkRateLimitAsync(`written-exam:${profile.id}`, 8, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Yazılı sınavı hazırlama limitine ulaştın. 1 dakika sonra tekrar dene.", code: "RATE_LIMITED" },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    const parsed = writtenExamSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz istek parametreleri." }, { status: 400 });
    }

    const { schoolName, academicYear, grade, subject, term, scenario, topics, questionCount, durationMinutes } =
      parsed.data;

    const basePoint = Math.floor(100 / questionCount);
    const remainder = 100 - basePoint * questionCount;

    const prompt = `Sen Türkiye Cumhuriyeti Millî Eğitim Bakanlığı (MEB) Ölçme ve Değerlendirme Genel Müdürlüğü uzmanısın.
Türkiye'deki resmi okullarda uygulanan yeni MEB Açık Uçlu Ortak Yazılı Sınav sistemine uygun resmi bir sınav hazırla.

BİLGİLER:
- Sınıf: ${grade}
- Ders: ${subject}
- Dönem/Sınav: ${term}
- MEB Senaryosu: ${scenario}
- Kazanım Konuları: ${topics}
- Toplam Soru Sayısı: ${questionCount}
- Sınav Süresi: ${durationMinutes} Dakika
- Toplam Puan: 100

KURALLAR:
1. Sorular KESİNLİKLE çoktan seçmeli (test) DEĞİLDİR. Tamamı MEB açık uçlu, işlem adımlı, kısa cevaplı veya gerekçeli açıklama gerektiren sorulardır.
2. Her soru için resmi MEB formatında bir kazanım kodu belirt (Örn: "M.8.1.1.3", "F.7.2.1.1", "T.8.3.14" gibi).
3. Her soru için toplam puan ve adım adım PUANLAMA BAREMİ (Rubrik) oluştur. Rubrik adımlarının toplamı soru puanına eşit olmalıdır.
4. Çözüm bölümünde öğrencinin yazması gereken ideal çözüm adımlarını göster.
5. Soruların toplam puanı tam olarak 100 yapmalıdır.

Yanıtı SADECE aşağıdaki JSON formatında ver, başka hiçbir metin ekleme:
{
  "questions": [
    {
      "number": 1,
      "kazanim": "Kazanım kodu ve kısa açıklaması",
      "text": "Açık uçlu soru metni",
      "points": ${basePoint + remainder},
      "solution": "Örnek tam çözüm adımları",
      "rubric": [
        { "step": "İlgili kural veya formülü doğru yazma", "points": ${Math.floor((basePoint + remainder) / 2)} },
        { "step": "İşlem adımlarını eksiksiz yürütüp doğru sonuca ulaşma", "points": ${Math.ceil((basePoint + remainder) / 2)} }
      ]
    }
  ]
}`;

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      // Mock pedagogical MEB exam generator
      const mockQuestions = Array.from({ length: questionCount }, (_, i) => {
        const qPoints = i === 0 ? basePoint + remainder : basePoint;
        const halfPoints = Math.floor(qPoints / 2);
        return {
          number: i + 1,
          kazanim: `${subject.slice(0, 1)}.${grade.replace(/[^0-9]/g, "") || "8"}.1.${i + 1}. ${topics} konusunda temel işlem ve muhakeme becerilerini açıklar.`,
          text: `${topics} konusunda Soru ${i + 1}: Bir problem durumunda verilen nicelikleri kullanarak işlem adımlarını sırasıyla gösteriniz ve ulaştığınız sonucu gerekçesiyle yazınız.`,
          points: qPoints,
          solution: `1. Adım: Verilen temel veriler denklem haline getirilir.\n2. Adım: Gerekli işlem adımları yürütülür.\n3. Adım: Sonuç bulunur ve sağlama yapılır.`,
          rubric: [
            { step: "Verilenleri tespit edip bağıntıyı kurma", points: halfPoints },
            { step: "İşlem adımlarını doğru uygulayıp sonuca ulaşma", points: qPoints - halfPoints },
          ],
        };
      });

      return NextResponse.json({
        schoolName,
        academicYear,
        grade,
        subject,
        term,
        scenario,
        durationMinutes,
        questions: mockQuestions,
        isMock: true,
      });
    }

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an expert Turkish MEB assessment specialist. Respond in valid JSON only." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      console.error("[OPENAI_EXAM_FAILED]", await aiRes.text());
      return NextResponse.json({ error: "Yapay zekâ sınavı hazırlarken bir hata oluştu." }, { status: 502 });
    }

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content;
    const parsedJson = JSON.parse(content || "{}");

    return NextResponse.json({
      schoolName,
      academicYear,
      grade,
      subject,
      term,
      scenario,
      durationMinutes,
      questions: parsedJson.questions || [],
      isMock: false,
    });
  } catch (error) {
    console.error("[WRITTEN_EXAM_API_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
