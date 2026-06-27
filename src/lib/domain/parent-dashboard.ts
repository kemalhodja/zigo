import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export type ChildQuizActivityItem = {
  attempt_id: string;
  quiz_id: string;
  quiz_title: string;
  total_questions: number;
  correct_answers: number;
  score_percent: number;
  points_awarded: number;
  completed_at: string;
};

export type ChildActivityItem = {
  activity_id: string;
  activity_type: "quiz_complete" | "micro_video_watched" | "mini_quiz_completed" | "duel_won" | "lesson_completed";
  title: string;
  points_awarded: number;
  metadata: Record<string, unknown>;
  created_at: string;
};

export async function getChildQuizActivity(
  supabase: SupabaseClient<Database>,
  childProfileId: string,
  limit = 10,
) {
  const { data, error } = await supabase.rpc("get_parent_child_quiz_activity", {
    target_child_profile_id: childProfileId,
    result_limit: limit,
  });

  if (error) throw error;
  return (data ?? []) as ChildQuizActivityItem[];
}

export async function getChildActivity(
  supabase: SupabaseClient<Database>,
  childProfileId: string,
  limit = 20,
) {
  const { data, error } = await supabase.rpc("get_parent_child_activity", {
    target_child_profile_id: childProfileId,
    result_limit: limit,
  });

  if (error) throw error;
  return (data ?? []) as ChildActivityItem[];
}
