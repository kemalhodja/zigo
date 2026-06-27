import type { SupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

import type { TeacherPlatformActivityStats } from "@/lib/domain/platform-activity";
import {
  TEACHER_STATS_CACHE_TAG,
  TEACHER_STATS_REVALIDATE_SECONDS,
  teacherStatsCacheTag,
} from "@/lib/domain/stats/cache-tags";
import { fetchTeacherPlatformActivityStatsUncached } from "@/lib/domain/stats/teacher-stats-engine";
import type { Database } from "@/lib/supabase/database.types";

export async function getCachedTeacherPlatformActivityStats(
  supabase: SupabaseClient<Database>,
  teacherId: string,
): Promise<TeacherPlatformActivityStats> {
  return unstable_cache(
    async () => fetchTeacherPlatformActivityStatsUncached(supabase, teacherId),
    ["teacher-platform-stats", teacherId],
    {
      tags: [TEACHER_STATS_CACHE_TAG, teacherStatsCacheTag(teacherId)],
      revalidate: TEACHER_STATS_REVALIDATE_SECONDS,
    },
  )();
}
