import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { getCachedTeacherPlatformActivityStats } from "@/lib/domain/stats/teacher-stats-cache";
import { fetchTeacherPlatformActivityStatsUncached } from "@/lib/domain/stats/teacher-stats-engine";
import { EXPERTISE_TRACKS } from "@/lib/domain/teacher-expertise";
import type { Database } from "@/lib/supabase/database.types";

export type TeacherPlatformActivityStats = {
  totalCompletedLessons: number;
  completedStudentCount: number;
  avgResponseMinutes: number;
};

export type TeacherExpertiseSelection = Database["public"]["Tables"]["teacher_expertise_selections"]["Row"];

export type VerifiedParentReview = {
  id: string;
  rating: number;
  comment: string | null;
  topicTags: string[];
  matchedTrackSlugs: string[];
  createdAt: string;
};

export type TeacherProfessionalTrustBundle = Awaited<ReturnType<typeof getTeacherProfessionalProfileBundle>>;

const VALID_TRACK_SLUGS = new Set<string>(EXPERTISE_TRACKS.map((track) => track.slug));

export const setExpertiseMatrixSchema = z.object({
  trackSlugs: z
    .array(z.string())
    .max(12)
    .refine((slugs) => slugs.every((slug) => VALID_TRACK_SLUGS.has(slug)), {
      message: "Geçersiz uzmanlık seçimi.",
    }),
});

export async function getTeacherPlatformActivityStats(
  supabase: SupabaseClient<Database>,
  teacherId: string,
  options?: { bypassCache?: boolean },
): Promise<TeacherPlatformActivityStats> {
  if (options?.bypassCache) {
    return fetchTeacherPlatformActivityStatsUncached(supabase, teacherId);
  }
  return getCachedTeacherPlatformActivityStats(supabase, teacherId);
}

export async function teacherHasApprovedCredentials(
  supabase: SupabaseClient<Database>,
  teacherId: string,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("teacher_has_approved_credentials", {
    target_teacher_id: teacherId,
  });

  if (error) throw error;
  return Boolean(data);
}

export async function getTeacherExpertiseMatrix(
  supabase: SupabaseClient<Database>,
  teacherId: string,
): Promise<TeacherExpertiseSelection[]> {
  const { data, error } = await supabase
    .from("teacher_expertise_selections")
    .select("*")
    .eq("teacher_id", teacherId)
    .order("review_boost_score", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function setTeacherExpertiseMatrix(
  supabase: SupabaseClient<Database>,
  trackSlugs: string[],
) {
  const parsed = setExpertiseMatrixSchema.parse({ trackSlugs });
  const { data, error } = await supabase.rpc("set_teacher_expertise_matrix", {
    track_slugs: parsed.trackSlugs,
  });

  if (error) throw error;
  return data ?? [];
}

export async function getVerifiedParentReviews(
  supabase: SupabaseClient<Database>,
  teacherId: string,
  limit = 6,
): Promise<VerifiedParentReview[]> {
  const { data, error } = await supabase
    .from("lesson_reviews")
    .select("id, rating, comment, topic_tags, matched_track_slugs, created_at")
    .eq("teacher_id", teacherId)
    .not("comment", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    topicTags: row.topic_tags ?? [],
    matchedTrackSlugs: row.matched_track_slugs ?? [],
    createdAt: row.created_at,
  }));
}

export async function getTeacherProfessionalProfileBundle(
  supabase: SupabaseClient<Database>,
  teacherId: string,
) {
  const [activity, expertise, credentialsApproved, reviews] = await Promise.all([
    getTeacherPlatformActivityStats(supabase, teacherId),
    getTeacherExpertiseMatrix(supabase, teacherId),
    teacherHasApprovedCredentials(supabase, teacherId),
    getVerifiedParentReviews(supabase, teacherId),
  ]);

  return { activity, expertise, credentialsApproved, reviews };
}
