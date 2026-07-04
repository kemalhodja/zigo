import type { SupabaseClient } from "@supabase/supabase-js";

import { getUserInterestAreaIds } from "@/lib/domain/profiles";
import type { Database } from "@/lib/supabase/database.types";

export async function getTeacherInboxCount(
  supabase: SupabaseClient<Database>,
  teacherId: string,
): Promise<number> {
  const areaIds = await getUserInterestAreaIds(supabase, teacherId);
  if (areaIds.length === 0) return 0;

  const { count, error } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .in("area_id", areaIds)
    .eq("is_resolved", false);

  if (error) return 0;
  return count ?? 0;
}
export async function getTeacherFeedInsights(
  supabase: SupabaseClient<Database>,
  teacherId: string,
): Promise<{ inboxCount: number; postCount: number }> {
  const [inboxCount, postsResult] = await Promise.all([
    getTeacherInboxCount(supabase, teacherId),
    supabase
      .from("social_posts")
      .select("*", { count: "exact", head: true })
      .eq("author_id", teacherId),
  ]);

  return {
    inboxCount,
    postCount: postsResult.count ?? 0,
  };
}
