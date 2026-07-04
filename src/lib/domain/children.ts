import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { updateChildGradeLevelSchema } from "@/lib/domain/grade-level";
import type { Database } from "@/lib/supabase/database.types";

export const createChildProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(100),
  ageGroup: z.string().trim().max(50).optional().default(""),
});

export const childProfileIdSchema = z.object({
  childProfileId: z.string().uuid(),
});

export const childInterestsSchema = childProfileIdSchema.extend({
  areaIds: z.array(z.coerce.number().int().positive()).max(20),
});

export const childLearningActionSchema = childProfileIdSchema.extend({
  kind: z.enum(["micro_video_watched", "mini_quiz_completed", "duel_won"]),
});

export const childAvatarUpdateSchema = childProfileIdSchema.extend({
  assets: z.object({
    hat: z.string().nullable().optional(),
    suit: z.string().nullable().optional(),
    pet: z.string().nullable().optional(),
    cape: z.string().nullable().optional(),
    frame: z.string().nullable().optional(),
  }),
});

export async function getChildProfiles(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("child_profiles")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function createChildProfile(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof createChildProfileSchema>,
) {
  const parsed = createChildProfileSchema.parse(input);

  const { data, error } = await supabase.rpc("create_child_profile", {
    display_name: parsed.displayName,
    age_group: parsed.ageGroup,
  });

  if (error) throw error;
  return data;
}

export async function getChildInterestAreaIds(
  supabase: SupabaseClient<Database>,
  childProfileId: string,
) {
  const { data, error } = await supabase
    .from("child_profile_interests")
    .select("area_id")
    .eq("child_profile_id", childProfileId);

  if (error) throw error;
  return data.map((interest) => interest.area_id);
}

export async function setChildProfileInterests(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof childInterestsSchema>,
) {
  const parsed = childInterestsSchema.parse(input);

  const { error } = await supabase.rpc("set_child_profile_interests", {
    target_child_profile_id: parsed.childProfileId,
    area_ids: [...new Set(parsed.areaIds)],
  });

  if (error) throw error;
}

export async function getChildPersonalizedFeed(
  supabase: SupabaseClient<Database>,
  childProfileId: string,
) {
  const areaIds = await getChildInterestAreaIds(supabase, childProfileId);

  if (areaIds.length === 0) {
    return [];
  }

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
    .in("post_type", ["normal", "micro"])
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title ?? row.caption,
    content: row.content,
    media_url: row.media_url,
    area_id: row.area_id,
    created_at: row.created_at,
    teacher: row.author
      ? {
          full_name: row.author.full_name,
          is_verified: row.author.is_verified,
        }
      : null,
  }));
}

export async function awardChildLearningPoints(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof childLearningActionSchema>,
) {
  const parsed = childLearningActionSchema.parse(input);

  const { data, error } = await supabase.rpc("award_child_learning_points", {
    target_child_profile_id: parsed.childProfileId,
    action_kind: parsed.kind,
  });

  if (error) throw error;
  return data[0];
}

export async function updateChildAvatarAssets(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof childAvatarUpdateSchema>,
) {
  const parsed = childAvatarUpdateSchema.parse(input);

  const { data, error } = await supabase.rpc("update_child_avatar_assets", {
    target_child_profile_id: parsed.childProfileId,
    assets: parsed.assets,
  });

  if (error) throw error;
  return data[0];
}

export async function updateChildGradeLevel(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof updateChildGradeLevelSchema>,
) {
  const parsed = updateChildGradeLevelSchema.parse(input);

  const { data, error } = await supabase.rpc("update_child_grade_level", {
    target_child_profile_id: parsed.childProfileId,
    next_grade_level: parsed.gradeLevel,
  });

  if (error) throw error;
  return data;
}
