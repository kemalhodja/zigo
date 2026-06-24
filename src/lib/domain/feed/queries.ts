import type { SupabaseClient } from "@supabase/supabase-js";

import type { ContentPostType, Database } from "@/lib/supabase/database.types";

import type { UnifiedFeedPost } from "./types";

export async function getPersonalizedFeed(
  supabase: SupabaseClient<Database>,
  userId: string,
  options?: { postTypes?: ContentPostType[] },
) {
  const { data: interests, error: interestsError } = await supabase
    .from("user_interests")
    .select("area_id")
    .eq("user_id", userId);

  if (interestsError) throw interestsError;

  const areaIds = interests.map((interest) => interest.area_id);
  if (areaIds.length === 0) return [] as UnifiedFeedPost[];

  const postTypes = options?.postTypes ?? ["normal", "micro"];

  const { data, error } = await supabase
    .from("social_posts")
    .select(
      `
      id,
      title,
      content,
      caption,
      media_url,
      area_id,
      post_type,
      quiz_id,
      created_at,
      author:author_id (
        full_name,
        is_verified
      )
    `,
    )
    .in("area_id", areaIds)
    .in("post_type", postTypes)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    caption: row.caption,
    media_url: row.media_url,
    area_id: row.area_id,
    post_type: row.post_type,
    quiz_id: row.quiz_id,
    created_at: row.created_at,
    teacher: row.author
      ? {
          full_name: row.author.full_name,
          is_verified: row.author.is_verified,
        }
      : null,
  })) as UnifiedFeedPost[];
}
