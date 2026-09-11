import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export async function getMatchedQuestions(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const { data: interests, error: interestsError } = await supabase
    .from("user_interests")
    .select("area_id")
    .eq("user_id", userId);

  if (interestsError) throw interestsError;

  const areaIds = interests.map((interest) => interest.area_id);

  if (areaIds.length === 0) {
    return [];
  }

  const { data, error } = await (supabase as any)
    .from("questions")
    .select(`
      *,
      author:users!author_id(full_name, avatar_url),
      answers(
        id,
        teacher_id,
        content,
        video_url,
        audio_url,
        media_duration_sec,
        created_at,
        teacher:users!teacher_id(full_name, avatar_url, is_verified)
      )
    `)
    .in("area_id", areaIds)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
