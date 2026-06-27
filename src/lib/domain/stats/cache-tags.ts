export const TEACHER_STATS_CACHE_TAG = "teacher-stats";
export const TEACHER_STATS_REVALIDATE_SECONDS = 3600;

export function teacherStatsCacheTag(teacherId: string) {
  return `${TEACHER_STATS_CACHE_TAG}:${teacherId}`;
}
