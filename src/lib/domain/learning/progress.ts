import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, LearningEventRow } from "@/lib/supabase/database.types";

import type { DailyMissionId, DailyMissionProgress, LearningHistoryItem, LearningProgressStats } from "./types";

export async function getLearningProgressStats(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<LearningProgressStats> {
  const { data, error } = await supabase
    .from("learning_events")
    .select("action_type, points_awarded")
    .eq("user_id", userId);

  if (error) throw error;

  const events = (data ?? []) as Pick<LearningEventRow, "action_type" | "points_awarded">[];
  return {
    eventCount: events.length,
    reelWatches: events.filter((event) => event.action_type === "reel_watch").length,
    quizCompletions: events.filter((event) => event.action_type === "quiz_complete").length,
    duelWins: events.filter((event) => event.action_type === "duel_win").length,
    focusSessions: events.filter((event) => event.action_type === "focus_session").length,
    pointsFromEvents: events.reduce((total, event) => total + event.points_awarded, 0),
  };
}

export async function getRecentLearningHistory(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<LearningHistoryItem[]> {
  const { data, error } = await supabase
    .from("learning_events")
    .select("id, action_type, points_awarded, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) throw error;
  return (data ?? []) as LearningHistoryItem[];
}

function startOfLocalDay(date = new Date()) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function mapActionToMission(actionType: LearningEventRow["action_type"]): DailyMissionId | null {
  if (actionType === "reel_watch") return "watch-reel";
  if (actionType === "quiz_complete") return "solve-quiz";
  if (actionType === "duel_win") return "safe-duel";
  if (actionType === "focus_session") return "focus-pomodoro";
  if (actionType === "store_visit") return "visit-store";
  return null;
}

function countLearningStreakDays(dates: string[]) {
  if (dates.length === 0) return 0;

  const uniqueDays = [...new Set(dates.map((value) => value.slice(0, 10)))].sort().reverse();
  let streak = 0;
  let cursor = startOfLocalDay();

  for (const day of uniqueDays) {
    const expected = cursor.toISOString().slice(0, 10);
    if (day !== expected) break;
    streak += 1;
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export async function getDailyMissionProgress(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<DailyMissionProgress> {
  const todayStart = startOfLocalDay();
  const streakWindowStart = new Date(todayStart);
  streakWindowStart.setDate(streakWindowStart.getDate() - 14);

  const { data, error } = await supabase
    .from("learning_events")
    .select("action_type, created_at")
    .eq("user_id", userId)
    .gte("created_at", streakWindowStart.toISOString())
    .order("created_at", { ascending: false });

  if (error) throw error;

  const events = (data ?? []) as Pick<LearningEventRow, "action_type" | "created_at">[];
  const todayEvents = events.filter((event) => new Date(event.created_at) >= todayStart);
  const completedIds = new Set<DailyMissionId>();

  for (const event of todayEvents) {
    const missionId = mapActionToMission(event.action_type);
    if (missionId) completedIds.add(missionId);
  }

  return {
    completedIds: [...completedIds],
    streakDays: countLearningStreakDays(events.map((event) => event.created_at)),
    eventsToday: todayEvents.length,
  };
}
