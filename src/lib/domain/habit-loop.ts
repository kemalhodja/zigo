import type { ChildActivityItem } from "@/lib/domain/parent-dashboard";

export type ParentWeeklyReviewSummary = {
  sinceDays: number;
  totalActions: number;
  totalPoints: number;
  microCount: number;
  quizCount: number;
  duelCount: number;
  activeChildCount: number;
  children: Array<{
    childId: string;
    childName: string;
    actions: number;
    points: number;
  }>;
};

export function buildParentWeeklyReview(input: {
  children: Array<{ id: string; name: string }>;
  activityByChildId: Record<string, ChildActivityItem[]>;
  sinceDays?: number;
  now?: Date;
}): ParentWeeklyReviewSummary {
  const sinceDays = input.sinceDays ?? 7;
  const now = input.now ?? new Date();
  const cutoff = now.getTime() - sinceDays * 24 * 60 * 60 * 1000;

  let totalActions = 0;
  let totalPoints = 0;
  let microCount = 0;
  let quizCount = 0;
  let duelCount = 0;
  const children: ParentWeeklyReviewSummary["children"] = [];

  for (const child of input.children) {
    const items = (input.activityByChildId[child.id] ?? []).filter(
      (item) => new Date(item.created_at).getTime() >= cutoff,
    );
    if (items.length === 0) continue;

    let points = 0;
    for (const item of items) {
      points += item.points_awarded;
      if (item.activity_type === "micro_video_watched") microCount += 1;
      else if (item.activity_type === "quiz_complete" || item.activity_type === "mini_quiz_completed") {
        quizCount += 1;
      } else if (item.activity_type === "duel_won") {
        duelCount += 1;
      }
    }

    totalActions += items.length;
    totalPoints += points;
    children.push({
      childId: child.id,
      childName: child.name,
      actions: items.length,
      points,
    });
  }

  children.sort((a, b) => b.points - a.points || b.actions - a.actions);

  return {
    sinceDays,
    totalActions,
    totalPoints,
    microCount,
    quizCount,
    duelCount,
    activeChildCount: children.length,
    children,
  };
}

export function orderQuizzesForHabitLoop<T extends { id: string; area_id: number | null }>(
  quizzes: T[],
  options?: { preferredQuizId?: string | null; preferredAreaId?: number | null },
): T[] {
  const preferredQuizId = options?.preferredQuizId ?? null;
  const preferredAreaId = options?.preferredAreaId ?? null;

  return [...quizzes].sort((a, b) => {
    const aQuizBoost = preferredQuizId && a.id === preferredQuizId ? 2 : 0;
    const bQuizBoost = preferredQuizId && b.id === preferredQuizId ? 2 : 0;
    const aAreaBoost = preferredAreaId != null && a.area_id === preferredAreaId ? 1 : 0;
    const bAreaBoost = preferredAreaId != null && b.area_id === preferredAreaId ? 1 : 0;
    return bQuizBoost + bAreaBoost - (aQuizBoost + aAreaBoost);
  });
}

export function buildLearnContinueHref(options: {
  areaId?: number | null;
  quizId?: string | null;
}) {
  const params = new URLSearchParams({ from: "micro" });
  if (options.quizId) params.set("quizId", options.quizId);
  if (options.areaId != null) params.set("areaId", String(options.areaId));
  return `/learn?${params.toString()}`;
}
