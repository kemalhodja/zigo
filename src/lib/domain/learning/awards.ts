import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";

import type { Database } from "@/lib/supabase/database.types";

import { completeSafeDuelSchema, completeVideoSchema } from "./schemas";
import type { LearningAwardResult } from "./types";

export async function completeVideoPost(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof completeVideoSchema>,
) {
  const parsed = completeVideoSchema.parse(input);

  if (parsed.childProfileId) {
    const { data, error } = await supabase.rpc("complete_child_video_post", {
      target_child_profile_id: parsed.childProfileId,
      target_post_id: parsed.postId,
      seconds_watched: parsed.secondsWatched,
    });

    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase.rpc("complete_video_post", {
    target_post_id: parsed.postId,
    seconds_watched: parsed.secondsWatched,
  });

  if (error) throw error;
  return data;
}

export async function completeSafeDuelWin(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof completeSafeDuelSchema> & { userId: string },
): Promise<LearningAwardResult> {
  const parsed = completeSafeDuelSchema.parse(input);

  // Anti-Cheat (Phase 2): Limit daily duel awards to 5 per user
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { count, error: countError } = await supabase
    .from("learning_events")
    .select("*", { count: "exact", head: true })
    .eq("user_id", input.userId)
    .eq("action_type", "safe_duel_win")
    .gte("created_at", startOfDay.toISOString());

  if (countError) throw countError;
  if (count !== null && count >= 5) {
    throw new Error("Anti-Cheat: Günlük maksimum düello ödülü sınırına (5) ulaştınız.");
  }

  const { data, error } = await supabase.rpc("award_safe_duel_win_points", {
    p_target_user_id: input.userId,
    p_duel_id: parsed.duelId,
    p_score: parsed.score,
    p_total_questions: parsed.totalQuestions,
    p_area_id: parsed.areaId ?? undefined,
  });

  if (error) throw error;
  const [result] = data ?? [];
  if (!result) {
    throw new Error("Duel reward could not be awarded.");
  }

  return result;
}
