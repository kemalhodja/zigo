import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import { asUntyped } from "@/lib/supabase/helpers";

export type QuestionTeacher = {
  full_name: string | null;
  avatar_url: string | null;
  is_verified: boolean;
};

export type QuestionAnswer = {
  id: string;
  teacher_id: string;
  content: string;
  video_url: string | null;
  audio_url: string | null;
  media_duration_sec: number | null;
  created_at: string;
  teacher: QuestionTeacher | null;
};

export type QuestionItem = {
  id: string;
  author_id: string;
  area_id: number;
  title: string;
  description: string;
  image_url: string | null;
  is_resolved: boolean;
  created_at: string;
  author?: { full_name: string | null; avatar_url: string | null } | null;
  answers?: QuestionAnswer[];
};

export async function getMatchedQuestions(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<QuestionItem[]> {
  const { data: interests, error: interestsError } = await supabase
    .from("user_interests")
    .select("area_id")
    .eq("user_id", userId);

  if (interestsError) throw interestsError;

  const areaIds = interests.map((interest) => interest.area_id);

  if (areaIds.length === 0) {
    return [];
  }

  const { data, error } = await asUntyped(supabase)
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
  return (data ?? []) as QuestionItem[];
}
