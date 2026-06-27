import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

/** Live lesson rewards are applied atomically in `complete_lesson_booking` (migration 070). */
export type LessonCompletionReward = {
  pointsAwarded: number;
  badge: "lesson_star";
  activityType: "lesson_completed";
};

export const LESSON_COMPLETION_REWARD_POINTS = 15;

export function describeLessonCompletionReward(childName?: string | null): string {
  const name = childName?.trim() || "Çocuğun";
  return `${name} canlı dersi tamamladı (+${LESSON_COMPLETION_REWARD_POINTS} puan, lesson_star rozeti).`;
}

export async function getChildLessonCompletionCount(
  supabase: SupabaseClient<Database>,
  childProfileId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("child_activity_events")
    .select("*", { count: "exact", head: true })
    .eq("child_profile_id", childProfileId)
    .eq("activity_type", "lesson_completed");

  if (error) throw error;
  return count ?? 0;
}
