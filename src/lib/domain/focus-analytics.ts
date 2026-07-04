import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { FocusSessionRow } from "@/lib/domain/study-moments";
import type { Database } from "@/lib/supabase/database.types";

export type StudentFocusAnalytics = {
  completedSessions: number;
  focusMinutesWeek: number;
  sharedMoments: number;
  weeklyGoal: number;
  weeklyCompleted: number;
  pointsFromFocus: number;
  activeSession: FocusSessionRow | null;
};

export type ParentFocusOverview = {
  matchedStudyMoments: number;
  focusMinutesInAreas: number;
  latestTopic: string | null;
  latestStudentName: string | null;
  latestCreatedAt: string | null;
};

export type StudyPlan = {
  id: string;
  user_id: string;
  area_id: number | null;
  weekly_pomodoro_goal: number;
  primary_topic: string;
  is_active: boolean;
  updated_at: string;
};

export const upsertStudyPlanSchema = z.object({
  areaId: z.coerce.number().int().positive().optional(),
  weeklyPomodoroGoal: z.coerce.number().int().min(1).max(21).default(5),
  primaryTopic: z.string().trim().min(2).max(120).default("Weekly focus plan"),
});

export async function getStudentFocusAnalytics(
  supabase: SupabaseClient<Database>,
): Promise<StudentFocusAnalytics> {
  const { data, error } = await supabase.rpc("get_student_focus_analytics");
  if (error) throw error;

  const [row] = data ?? [];
  const activeSession =
    row?.active_session_id && row.active_session_started_at
      ? {
          id: row.active_session_id,
          user_id: "",
          area_id: null,
          topic_label: row.active_session_topic ?? "Focused study",
          target_seconds: row.active_session_target_seconds ?? 1500,
          started_at: row.active_session_started_at,
          completed_at: null,
          status: "in_progress" as const,
          points_awarded: 0,
        }
      : null;

  return {
    completedSessions: row?.completed_sessions ?? 0,
    focusMinutesWeek: row?.focus_minutes_week ?? 0,
    sharedMoments: row?.shared_moments ?? 0,
    weeklyGoal: row?.weekly_goal ?? 5,
    weeklyCompleted: row?.weekly_completed ?? 0,
    pointsFromFocus: row?.points_from_focus ?? 0,
    activeSession,
  };
}

export async function getActiveFocusSession(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase.rpc("get_active_focus_session");
  if (error) throw error;
  return (data ?? null) as FocusSessionRow | null;
}

export async function getParentFocusOverview(supabase: SupabaseClient<Database>): Promise<ParentFocusOverview> {
  const { data, error } = await supabase.rpc("get_parent_focus_overview");
  if (error) throw error;

  const [row] = data ?? [];
  return {
    matchedStudyMoments: row?.matched_study_moments ?? 0,
    focusMinutesInAreas: row?.focus_minutes_in_areas ?? 0,
    latestTopic: row?.latest_topic ?? null,
    latestStudentName: row?.latest_student_name ?? null,
    latestCreatedAt: row?.latest_created_at ?? null,
  };
}

export async function upsertStudyPlan(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof upsertStudyPlanSchema>,
) {
  const parsed = upsertStudyPlanSchema.parse(input);

  const { data, error } = await supabase.rpc("upsert_study_plan", {
    p_area_id: parsed.areaId,
    p_weekly_pomodoro_goal: parsed.weeklyPomodoroGoal,
    p_primary_topic: parsed.primaryTopic,
  });

  if (error) throw error;
  return data as StudyPlan;
}

export async function getParentChildrenFocusStats(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase.rpc("get_parent_children_focus_stats");
  if (error) throw error;
  return (data ?? []) as Array<{
    child_profile_id: string;
    display_name: string;
    completed_sessions: number;
    focus_minutes_week: number;
    total_points: number;
  }>;
}

export function getWeeklyGoalProgress(completed: number, goal: number) {
  if (goal <= 0) return 0;
  return Math.min(100, (completed / goal) * 100);
}
