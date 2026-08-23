import type { ChildActivityItem } from "@/lib/domain/parent-dashboard";

export type WeeklyDayStat = {
  day: string;
  /** O gün kazanılan toplam XP */
  minutes: number;
  /** O gün tamamlanan quiz + mini quiz sayısı */
  quizzes: number;
};

export type CategoryBreakdownItem = {
  subject: string;
  minutes: number;
  color: string;
};

const DAY_LABELS = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cts"];

const CATEGORY_META: Record<ChildActivityItem["activity_type"], { subject: string; color: string }> = {
  quiz_complete: { subject: "Quiz", color: "#8b5cf6" },
  mini_quiz_completed: { subject: "Mini Quiz", color: "#f59e0b" },
  micro_video_watched: { subject: "Micro Video", color: "#10b981" },
  duel_won: { subject: "Düello", color: "#ef4444" },
};

/**
 * Çocuğun son aktivitelerinden son 7 günün XP/quiz dağılımını ve
 * kategori bazlı puan kırılımını hesaplar. Mock veri içermez.
 */
export function buildParentActivityStats(
  activities: ChildActivityItem[],
): { chartData: WeeklyDayStat[]; breakdownData: CategoryBreakdownItem[] } {
  const today = new Date();
  const days: Array<WeeklyDayStat & { key: string }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    days.push({ key: d.toDateString(), day: DAY_LABELS[d.getDay()], minutes: 0, quizzes: 0 });
  }

  const byCategory = new Map<ChildActivityItem["activity_type"], number>();
  for (const activity of activities) {
    const d = new Date(activity.created_at);
    const slot = days.find((x) => x.key === d.toDateString());
    const points = activity.points_awarded ?? 0;
    if (slot) {
      slot.minutes += points;
      if (activity.activity_type === "quiz_complete" || activity.activity_type === "mini_quiz_completed") {
        slot.quizzes += 1;
      }
    }
    byCategory.set(activity.activity_type, (byCategory.get(activity.activity_type) ?? 0) + points);
  }

  const breakdownData: CategoryBreakdownItem[] = [...byCategory.entries()]
    .filter(([, value]) => value > 0)
    .map(([type, value]) => ({
      subject: CATEGORY_META[type]?.subject ?? type,
      minutes: value,
      color: CATEGORY_META[type]?.color ?? "#94a3b8",
    }))
    .sort((a, b) => b.minutes - a.minutes);

  return { chartData: days.map(({ day, minutes, quizzes }) => ({ day, minutes, quizzes })), breakdownData };
}
