/**
 * AI daily study plan (#10).
 * Blends real user telemetry into either an LLM-generated plan or a solid
 * deterministic fallback so the feature works before OPENAI_API_KEY exists.
 */

import { z } from "zod";

export const planBlockSchema = z.object({
  timeLabel: z.string().trim().min(1).max(40),
  subject: z.string().trim().min(1).max(60),
  task: z.string().trim().min(3).max(160),
  minutes: z.number().int().min(5).max(180),
});

export const studyPlanSchema = z.object({
  summary: z.string().trim().min(3).max(300),
  blocks: z.array(planBlockSchema).min(2).max(6),
  motivation: z.string().trim().min(3).max(200),
});

export type PlanBlock = z.infer<typeof planBlockSchema>;
export type StudyPlan = z.infer<typeof studyPlanSchema> & {
  source: "ai" | "rule";
};

export type PlanContext = {
  displayName: string;
  weeklyFocusMinutes: number;
  dueReviewCount: number;
  reviewSampleTopics: string[];
  quizCount7d: number;
  gamePlays7d: number;
};

/** Builds the LLM system+user prompt from real telemetry. */
export function buildPlanPrompt(ctx: PlanContext): { system: string; user: string } {
  const system =
    "Sen Zigo AI Koç'sun. Türk lise/ortaokul öğrencilerine günlük çalışma planı hazırlarsın. " +
    "Sadece geçerli JSON döndür: {\"summary\": string, \"blocks\": [{\"timeLabel\": string, \"subject\": string, \"task\": string, \"minutes\": number}], \"motivation\": string}. " +
    "2-4 blok üret. Bloklar gerçekçi dakikalar içersin (25-90). Samimi, motive edici ve SOMUT ol.";

  const topics =
    ctx.reviewSampleTopics.length > 0
      ? ctx.reviewSampleTopics.map((t) => `- ${t}`).join("\n")
      : "- (tekrar kartı yok)";

  const user = [
    `Öğrenci: ${ctx.displayName}`,
    `Son 7 gün odak süresi: ${ctx.weeklyFocusMinutes} dakika`,
    `Bugün bekleyen tekrar kartı: ${ctx.dueReviewCount}`,
    `Son 7 gün quiz sayısı: ${ctx.quizCount7d}, oyun oynama: ${ctx.gamePlays7d}`,
    "Zayıf konular (tekrar kartlarından):",
    topics,
    ctx.weeklyFocusMinutes < 50
      ? "Not: Öğrenci bu hafta az çalışmış — kısa ve achievable bir plan ver, motivasyonu ön planda tut."
      : "Not: Öğrenci düzenli çalışıyor — hafif zorlayan bir plan ver.",
  ].join("\n");

  return { system, user };
}

/** Deterministic fallback plan grounded in the same telemetry. */
export function buildRuleBasedPlan(ctx: PlanContext): StudyPlan {
  const blocks: PlanBlock[] = [];

  if (ctx.dueReviewCount > 0) {
    blocks.push({
      timeLabel: "Bloklar başlarken",
      subject: "Tekrar",
      task: `${Math.min(ctx.dueReviewCount, 10)} bekleyen tekrar kartını bitir — unutmadan önce pekiştir.`,
      minutes: Math.min(15 + ctx.dueReviewCount * 2, 30),
    });
  }

  blocks.push({
    timeLabel: "Zihnin tazeyken",
    subject: "Soru Çözümü",
    task:
      ctx.quizCount7d === 0
        ? "Bugün Quiz Arena'dan bir quiz çöz — sıcağa gir."
        : "Yeni bir quiz seti çöz ve yanlışlarını işaretle.",
    minutes: 40,
  });

  blocks.push({
    timeLabel: "Odak bloğu",
    subject: "Çalışma",
    task: "Bir odak odasına katıl; :00 veya :30'da başlayan 25 dk bloğu tamamla.",
    minutes: 25,
  });

  if (ctx.gamePlays7d === 0) {
    blocks.push({
      timeLabel: "Ara molasında",
      subject: "Oyunla Öğren",
      task: "Matematik Ustası'nda bir tur at — hızlı düşünmeyi ısıtır.",
      minutes: 15,
    });
  }

  const tone =
    ctx.weeklyFocusMinutes < 50
      ? "Küçük başlamak da başlamaktır. Bugün sadece bu blokları bitsin — yarını yarın düşüneceğiz. 💪"
      : "Rutin kilitleniyor. Bu tempoyu koru, lig tablosundaki yerin konuşulacak! 🔥";

  return {
    source: "rule",
    summary:
      ctx.dueReviewCount > 0
        ? `${ctx.dueReviewCount} tekrar kartı bekliyor — önce onları temizle, sonra yeni soruya geç.`
        : "Bugünün hedefi: bir quiz + bir odak bloğu. Az ama düzenli, her şeyden iyidir.",
    blocks,
    motivation: tone,
  };
}

/** Parses LLM output defensively; returns null when unusable. */
export function parseAiPlan(rawContent: string): StudyPlan | null {
  try {
    const jsonStart = rawContent.indexOf("{");
    const jsonEnd = rawContent.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd <= jsonStart) return null;

    const parsed = studyPlanSchema.safeParse(JSON.parse(rawContent.slice(jsonStart, jsonEnd + 1)));
    if (!parsed.success) return null;

    return { ...parsed.data, source: "ai" };
  } catch {
    return null;
  }
}
