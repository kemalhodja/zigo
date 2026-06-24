import type { ContentPostType } from "@/lib/supabase/database.types";

export type UnifiedFeedPost = {
  id: string;
  title: string | null;
  content: string | null;
  caption: string;
  media_url: string | null;
  area_id: number | null;
  post_type: ContentPostType;
  quiz_id: string | null;
  created_at: string;
  teacher: {
    full_name: string;
    is_verified: boolean;
  } | null;
};

export function resolvePostType(input: {
  postType?: "normal" | "micro";
  mediaUrl?: string;
}) {
  if (input.postType) return input.postType;
  return input.mediaUrl ? "micro" : "normal";
}
