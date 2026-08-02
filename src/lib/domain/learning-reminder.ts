export const DAILY_MISSION_TOTAL = 5;

export type LearningReminderInput = {
  role: "student" | "parent" | "teacher" | "guest" | string;
  completedMissionCount: number;
  streakDays: number;
  missionTotal?: number;
};

export type LearningReminderDecision = {
  shouldNotify: boolean;
  reason: "incomplete_missions" | "streak_at_risk" | null;
  title: string;
  message: string;
  href: string;
};

/** Pure decision: remind students with incomplete daily missions or an at-risk streak. */
export function decideLearningReminder(input: LearningReminderInput): LearningReminderDecision {
  const missionTotal = input.missionTotal ?? DAILY_MISSION_TOTAL;
  const completed = Math.max(0, Math.min(missionTotal, input.completedMissionCount));

  if (input.role !== "student") {
    return { shouldNotify: false, reason: null, title: "", message: "", href: "/student" };
  }

  if (completed < missionTotal) {
    return {
      shouldNotify: true,
      reason: "incomplete_missions",
      title: "Günlük görevler seni bekliyor",
      message: `Bugün ${completed}/${missionTotal} görev tamamlandı. Kısa bir ders veya quiz ile streak’ini koru.`,
      href: "/student",
    };
  }

  if (input.streakDays > 0 && input.streakDays < 2) {
    return {
      shouldNotify: true,
      reason: "streak_at_risk",
      title: "Streak’ini koru",
      message: "Bugün bir öğrenme eylemi yaparak serini uzat.",
      href: "/micro",
    };
  }

  return { shouldNotify: false, reason: null, title: "", message: "", href: "/student" };
}

export function formatMissionProgressLabel(completed: number, total = DAILY_MISSION_TOTAL) {
  const safeCompleted = Math.max(0, Math.min(total, completed));
  return `${safeCompleted}/${total}`;
}
