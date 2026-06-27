import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import type { LiveLessonRow } from "./types";

export async function getLiveLessonByBookingId(
  supabase: SupabaseClient<Database>,
  bookingId: string,
): Promise<LiveLessonRow | null> {
  const { data, error } = await supabase
    .from("live_lessons")
    .select("*")
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as LiveLessonRow | null;
}

export async function listLiveLessonsForUser(
  supabase: SupabaseClient<Database>,
  userId: string,
  role: "parent" | "teacher",
): Promise<LiveLessonRow[]> {
  const column = role === "parent" ? "parent_id" : "teacher_id";
  const { data, error } = await supabase
    .from("live_lessons")
    .select("*")
    .eq(column, userId)
    .gte("end_time", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order("start_time", { ascending: true })
    .limit(20);

  if (error) throw error;
  return (data ?? []) as LiveLessonRow[];
}
