import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export async function processDueLessonReminders(
  supabase: SupabaseClient<Database>,
  windowMinutes = 60,
): Promise<number> {
  const { data, error } = await supabase.rpc("process_lesson_reminders", {
    window_minutes: windowMinutes,
  });

  if (error) throw error;
  return Number(data ?? 0);
}
