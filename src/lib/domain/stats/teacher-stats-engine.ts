import type { SupabaseClient } from "@supabase/supabase-js";

import type { TeacherPlatformActivityStats } from "@/lib/domain/platform-activity";
import type { Database } from "@/lib/supabase/database.types";

export async function fetchTeacherPlatformActivityStatsUncached(
  supabase: SupabaseClient<Database>,
  teacherId: string,
): Promise<TeacherPlatformActivityStats> {
  const { data, error } = await supabase.rpc("get_teacher_platform_activity_stats", {
    target_teacher_id: teacherId,
  });

  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;
  return {
    totalCompletedLessons: row?.total_completed_lessons ?? 0,
    completedStudentCount: row?.completed_student_count ?? 0,
    avgResponseMinutes: row?.avg_response_minutes ?? 0,
  };
}

export async function recomputeTeacherStatsEngine(
  supabase: SupabaseClient<Database>,
  teacherId: string,
) {
  const { data, error } = await supabase.rpc("recompute_teacher_stats", {
    target_teacher_id: teacherId,
  });

  if (error) throw error;
  return data;
}

export async function applyTeacherStatsOnLessonComplete(
  supabase: SupabaseClient<Database>,
  bookingId: string,
  progressScore = 85,
) {
  const { data, error } = await supabase.rpc("apply_teacher_stats_on_lesson_complete", {
    target_booking_id: bookingId,
    lesson_progress_score: progressScore,
  });

  if (error) throw error;
  return data;
}
