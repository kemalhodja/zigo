import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/lib/supabase/database.types";

export type TeacherCredentialType = "diploma" | "e_devlet";

export type LessonReviewRow = {
  id: string;
  booking_id: string;
  parent_id: string;
  teacher_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

const credentialSchema = z.object({
  credentialType: z.enum(["diploma", "e_devlet"]),
  documentUrl: z.string().url().max(500),
});

const reviewSchema = z.object({
  bookingId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional(),
});

const disputeSchema = z.object({
  bookingId: z.string().uuid(),
  reason: z.string().trim().min(10).max(2000),
});

export async function submitTeacherCredential(
  supabase: SupabaseClient<Database>,
  teacherId: string,
  input: z.infer<typeof credentialSchema>,
) {
  const parsed = credentialSchema.parse(input);
  const { data, error } = await supabase
    .from("teacher_credential_submissions")
    .insert({
      teacher_id: teacherId,
      credential_type: parsed.credentialType,
      document_url: parsed.documentUrl,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function confirmLessonPayment(
  supabase: SupabaseClient<Database>,
  bookingId: string,
  side: "parent" | "teacher",
) {
  const { data, error } = await supabase.rpc("confirm_lesson_payment", {
    target_booking_id: bookingId,
    side,
  });
  if (error) throw error;
  return data;
}

export async function createLessonReview(
  supabase: SupabaseClient<Database>,
  parentId: string,
  input: z.infer<typeof reviewSchema>,
) {
  const parsed = reviewSchema.parse(input);

  const { data: booking, error: bookingError } = await supabase
    .from("lesson_bookings")
    .select("id, teacher_id, payment_status")
    .eq("id", parsed.bookingId)
    .eq("parent_id", parentId)
    .maybeSingle();

  if (bookingError) throw bookingError;
  if (!booking) throw new Error("Booking not found.");
  if (booking.payment_status !== "payment_confirmed") {
    throw new Error("Reviews are available only after payment is confirmed by both sides.");
  }

  const { data, error } = await supabase
    .from("lesson_reviews")
    .insert({
      booking_id: parsed.bookingId,
      parent_id: parentId,
      teacher_id: booking.teacher_id,
      rating: parsed.rating,
      comment: parsed.comment ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as LessonReviewRow;
}

export async function listTeacherReviews(
  supabase: SupabaseClient<Database>,
  teacherId: string,
  limit = 20,
) {
  const { data, error } = await supabase
    .from("lesson_reviews")
    .select("id, booking_id, parent_id, teacher_id, rating, comment, created_at")
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as LessonReviewRow[];
}

export async function openPaymentDispute(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof disputeSchema>,
) {
  const parsed = disputeSchema.parse(input);
  const { data, error } = await supabase.rpc("open_payment_dispute", {
    target_booking_id: parsed.bookingId,
    dispute_reason: parsed.reason,
  });
  if (error) throw error;
  return data;
}

export async function getTeacherReviewStats(
  supabase: SupabaseClient<Database>,
  teacherId: string,
) {
  const { data, error } = await supabase
    .from("lesson_reviews")
    .select("rating")
    .eq("teacher_id", teacherId);

  if (error) throw error;
  const ratings = (data ?? []).map((row) => row.rating);
  if (ratings.length === 0) {
    return { count: 0, average: 0 };
  }
  const average = ratings.reduce((sum, value) => sum + value, 0) / ratings.length;
  return { count: ratings.length, average: Math.round(average * 10) / 10 };
}
