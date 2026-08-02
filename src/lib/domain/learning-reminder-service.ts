import type { SupabaseClient } from "@supabase/supabase-js";

import { decideLearningReminder } from "@/lib/domain/learning-reminder";
import { getDailyMissionProgress } from "@/lib/domain/learning";
import type { Database } from "@/lib/supabase/database.types";

/** Insert at most one learning reminder system notification per local day. */
export async function ensureLearningReminderNotification(
  supabase: SupabaseClient<Database>,
  userId: string,
  role: string,
) {
  const progress = await getDailyMissionProgress(supabase, userId);
  const decision = decideLearningReminder({
    role,
    completedMissionCount: progress.completedIds.length,
    streakDays: progress.streakDays,
  });

  if (!decision.shouldNotify) {
    return { created: false as const, decision, progress };
  }

  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  const { data: existing } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", userId)
    .eq("kind", "system")
    .eq("message", decision.message)
    .gte("created_at", dayStart.toISOString())
    .limit(1);

  if ((existing ?? []).length > 0) {
    return { created: false as const, decision, progress };
  }

  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    kind: "system",
    message: `${decision.title}: ${decision.message}`,
    is_read: false,
  });

  if (error) throw error;
  return { created: true as const, decision, progress };
}
