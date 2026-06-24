import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";

import { assertSafeStudentTextAsync } from "@/lib/domain/moderation";
import type { Database } from "@/lib/supabase/database.types";

import { createPostSchema } from "./schemas";
import { resolvePostType } from "./types";

export async function createTeacherPost(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof createPostSchema>,
) {
  const parsed = createPostSchema.parse(input);
  const postType = resolvePostType(parsed);
  const [safeTitle, safeContent] = await Promise.all([
    assertSafeStudentTextAsync(parsed.title),
    assertSafeStudentTextAsync(parsed.content),
  ]);
  const hasMedia = Boolean(parsed.mediaUrl);

  const { data, error } = await supabase
    .from("social_posts")
    .insert({
      author_id: parsed.teacherId,
      area_id: parsed.areaId,
      caption: safeTitle,
      title: safeTitle,
      content: safeContent,
      media_url: parsed.mediaUrl || null,
      media_type: hasMedia ? "video" : "image",
      is_reel: postType === "micro",
      post_type: postType,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
