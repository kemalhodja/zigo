import { createClient } from "@/lib/supabase/server";

export type FocusAnalytics = {
  completed_sessions: number;
  focus_minutes_week: number;
  shared_moments: number;
  weekly_goal: number;
  weekly_completed: number;
  points_from_focus: number;
  active_session_id: string | null;
  active_session_started_at: string | null;
  active_session_target_seconds: number | null;
  active_session_topic: string | null;
};

export async function getFocusAnalytics(): Promise<FocusAnalytics | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase.rpc("get_student_focus_analytics");

  if (error) {
    console.error("Focus analytics error:", error);
    return null;
  }

  return (data?.[0] as FocusAnalytics) ?? null;
}