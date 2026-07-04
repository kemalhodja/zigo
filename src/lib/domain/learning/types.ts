import type { LearningEventRow } from "@/lib/supabase/database.types";

export type LearningProgressStats = {
  eventCount: number;
  reelWatches: number;
  quizCompletions: number;
  duelWins: number;
  focusSessions: number;
  pointsFromEvents: number;
};

export type LearningHistoryItem = Pick<
  LearningEventRow,
  "id" | "action_type" | "points_awarded" | "created_at"
>;

export type DailyMissionId = "watch-reel" | "solve-quiz" | "safe-duel" | "focus-pomodoro" | "visit-store";

export type DailyMissionProgress = {
  completedIds: DailyMissionId[];
  streakDays: number;
  eventsToday: number;
};

export type LearningAwardResult = {
  event_id: string | null;
  points_awarded: number;
  already_awarded: boolean;
  total_points: number;
};
