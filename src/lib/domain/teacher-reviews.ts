import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/lib/supabase/database.types";

export type TeacherReviewSummary = {
  total_reviews: number;
  avg_rating: number;
  avg_clarity: number;
  avg_communication: number;
  avg_pedagogy: number;
  recommendation_rate: number;
};

export type TeacherReviewItem = {
  id: string;
  parent_id: string;
  parent_name: string;
  parent_avatar_url: string | null;
  rating_clarity: number;
  rating_communication: number;
  rating_pedagogy: number;
  overall_rating: number;
  comment: string;
  created_at: string;
};

export const createTeacherReviewSchema = z.object({
  teacherId: z.string().uuid(),
  ratingClarity: z.number().int().min(1).max(5),
  ratingCommunication: z.number().int().min(1).max(5),
  ratingPedagogy: z.number().int().min(1).max(5),
  comment: z.string().trim().min(5, "Yorumunuz en az 5 karakter olmalıdır").max(1000),
  postId: z.string().uuid().optional().nullable(),
});

export async function getTeacherReviewSummary(
  supabase: SupabaseClient<Database>,
  teacherId: string,
): Promise<TeacherReviewSummary> {
  try {
    const { data, error } = await (supabase.rpc as any)(
      "get_teacher_review_summary",
      { target_teacher_id: teacherId },
    );

    if (error || !data) {
      return {
        total_reviews: 0,
        avg_rating: 5.0,
        avg_clarity: 5.0,
        avg_communication: 5.0,
        avg_pedagogy: 5.0,
        recommendation_rate: 100,
      };
    }

    return data as unknown as TeacherReviewSummary;
  } catch {
    return {
      total_reviews: 0,
      avg_rating: 5.0,
      avg_clarity: 5.0,
      avg_communication: 5.0,
      avg_pedagogy: 5.0,
      recommendation_rate: 100,
    };
  }
}

export async function getTeacherReviews(
  supabase: SupabaseClient<Database>,
  teacherId: string,
  limit = 10,
): Promise<TeacherReviewItem[]> {
  try {
    const { data, error } = await (supabase as any)
      .from("teacher_reviews")
      .select(`
        id,
        parent_id,
        rating_clarity,
        rating_communication,
        rating_pedagogy,
        overall_rating,
        comment,
        created_at,
        parent:parent_id (
          full_name,
          avatar_url
        )
      `)
      .eq("teacher_id", teacherId)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.id,
      parent_id: row.parent_id,
      parent_name: row.parent?.full_name || "Veli",
      parent_avatar_url: row.parent?.avatar_url || null,
      rating_clarity: row.rating_clarity,
      rating_communication: row.rating_communication,
      rating_pedagogy: row.rating_pedagogy,
      overall_rating: Number(row.overall_rating) || 5.0,
      comment: row.comment,
      created_at: row.created_at,
    }));
  } catch {
    return [];
  }
}

export async function submitTeacherReview(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof createTeacherReviewSchema>,
) {
  const parsed = createTeacherReviewSchema.parse(input);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Oturum açmanız gerekmektedir.");

  const { data, error } = await (supabase as any)
    .from("teacher_reviews")
    .upsert({
      teacher_id: parsed.teacherId,
      parent_id: user.id,
      post_id: parsed.postId ?? null,
      rating_clarity: parsed.ratingClarity,
      rating_communication: parsed.ratingCommunication,
      rating_pedagogy: parsed.ratingPedagogy,
      comment: parsed.comment,
      status: "approved",
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
