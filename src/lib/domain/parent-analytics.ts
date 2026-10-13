import type { ChildQuizActivityItem } from "@/lib/domain/parent-dashboard";

export type ParentInsightLevel = "strong" | "steady" | "needs_support";

export type ParentQuizInsight = {
  quizTitle: string;
  attempts: number;
  accuracy: number;
  level: ParentInsightLevel;
};

export type ParentAnalyticsSummary = {
  totalAttempts: number;
  totalQuestions: number;
  totalCorrect: number;
  accuracy: number | null;
  pointsEarned: number;
  last7DaysAttempts: number;
  previous7DaysAttempts: number;
  weeklyTrendPercent: number | null;
  quizInsights: ParentQuizInsight[];
  strongest: ParentQuizInsight | null;
  weakest: ParentQuizInsight | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function classifyAccuracy(accuracy: number): ParentInsightLevel {
  if (accuracy >= 85) return "strong";
  if (accuracy >= 60) return "steady";
  return "needs_support";
}

export function buildParentAnalyticsSummary(
  activity: ChildQuizActivityItem[],
  now: Date = new Date(),
): ParentAnalyticsSummary {
  const nowMs = now.getTime();
  let totalQuestions = 0;
  let totalCorrect = 0;
  let pointsEarned = 0;
  let last7DaysAttempts = 0;
  let previous7DaysAttempts = 0;

  const byQuiz = new Map<string, { title: string; attempts: number; questions: number; correct: number }>();

  for (const item of activity) {
    const questions = Math.max(0, item.total_questions ?? 0);
    const correct = Math.min(questions, Math.max(0, item.correct_answers ?? 0));
    totalQuestions += questions;
    totalCorrect += correct;
    pointsEarned += Math.max(0, item.points_awarded ?? 0);

    const completedMs = new Date(item.completed_at).getTime();
    if (Number.isFinite(completedMs)) {
      const age = nowMs - completedMs;
      if (age >= 0 && age < 7 * DAY_MS) last7DaysAttempts += 1;
      else if (age >= 7 * DAY_MS && age < 14 * DAY_MS) previous7DaysAttempts += 1;
    }

    const existing = byQuiz.get(item.quiz_id) ?? { title: item.quiz_title, attempts: 0, questions: 0, correct: 0 };
    existing.attempts += 1;
    existing.questions += questions;
    existing.correct += correct;
    byQuiz.set(item.quiz_id, existing);
  }

  const quizInsights: ParentQuizInsight[] = [...byQuiz.values()]
    .filter((q) => q.questions > 0)
    .map((q) => {
      const accuracy = Math.round((q.correct / q.questions) * 100);
      return { quizTitle: q.title, attempts: q.attempts, accuracy, level: classifyAccuracy(accuracy) };
    })
    .sort((a, b) => b.accuracy - a.accuracy);

  const weeklyTrendPercent =
    previous7DaysAttempts > 0
      ? Math.round(((last7DaysAttempts - previous7DaysAttempts) / previous7DaysAttempts) * 100)
      : null;

  return {
    totalAttempts: activity.length,
    totalQuestions,
    totalCorrect,
    accuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : null,
    pointsEarned,
    last7DaysAttempts,
    previous7DaysAttempts,
    weeklyTrendPercent,
    quizInsights,
    strongest: quizInsights.length > 1 ? quizInsights[0] : null,
    weakest: quizInsights.length > 1 ? quizInsights[quizInsights.length - 1] : null,
  };
}

export function buildParentDigest(childName: string, summary: ParentAnalyticsSummary): string {
  if (summary.totalAttempts === 0) {
    return `${childName} henüz quiz çözmedi. İlk quiz tamamlandığında gelişim özeti burada otomatik oluşacak.`;
  }

  const parts: string[] = [
    `${childName} son kayıtlı ${summary.totalAttempts} quizde ${summary.totalQuestions} soru çözdü` +
      (summary.accuracy !== null ? ` ve %${summary.accuracy} doğruluk yakaladı.` : "."),
  ];

  if (summary.weeklyTrendPercent !== null) {
    parts.push(
      summary.weeklyTrendPercent >= 0
        ? `Bu hafta çalışma temposu geçen haftaya göre %${summary.weeklyTrendPercent} arttı.`
        : `Bu hafta çalışma temposu geçen haftaya göre %${Math.abs(summary.weeklyTrendPercent)} azaldı.`,
    );
  }

  if (summary.strongest && summary.weakest && summary.strongest.quizTitle !== summary.weakest.quizTitle) {
    parts.push(
      `En güçlü olduğu çalışma "${summary.strongest.quizTitle}" (%${summary.strongest.accuracy}); ` +
        `desteğe ihtiyaç duyduğu çalışma "${summary.weakest.quizTitle}" (%${summary.weakest.accuracy}).`,
    );
  }

  return parts.join(" ");
}
