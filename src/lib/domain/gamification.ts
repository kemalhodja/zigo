import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/lib/supabase/database.types";

export const learningActionSchema = z.object({
  studentId: z.string().uuid(),
  kind: z.enum(["micro_video_watched", "mini_quiz_completed", "duel_won"]),
});

export const avatarUpdateSchema = z.object({
  studentId: z.string().uuid(),
  assets: z.object({
    hat: z.string().nullable().optional(),
    suit: z.string().nullable().optional(),
    pet: z.string().nullable().optional(),
    cape: z.string().nullable().optional(),
    frame: z.string().nullable().optional(),
  }),
});

export async function awardLearningPoints(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof learningActionSchema>,
) {
  const parsed = learningActionSchema.parse(input);

  const { data, error } = await supabase.rpc("award_learning_points", {
    student_id: parsed.studentId,
    action_kind: parsed.kind,
  });

  if (error) throw error;
  return data[0];
}

export async function updateAvatarAssets(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof avatarUpdateSchema>,
) {
  const parsed = avatarUpdateSchema.parse(input);

  const { data, error } = await supabase.rpc("update_avatar_assets", {
    student_id: parsed.studentId,
    assets: parsed.assets,
  });

  if (error) throw error;
  return data[0];
}
