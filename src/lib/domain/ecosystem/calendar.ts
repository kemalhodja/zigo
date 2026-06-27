import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { DomainForbiddenError } from "@/lib/domain/domain-errors";
import type { Database } from "@/lib/supabase/database.types";

export const createAvailabilitySlotSchema = z.object({
  teacherId: z.string().uuid(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
});

export const bookSlotSchema = z.object({
  slotId: z.string().uuid(),
  parentId: z.string().uuid(),
  childProfileId: z.string().uuid().optional(),
  areaId: z.number().int().positive().optional(),
});

export type TeacherAvailabilityRow = {
  id: string;
  teacher_id: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  created_at: string;
};

export async function listTeacherOpenSlots(
  supabase: SupabaseClient<Database>,
  teacherId: string,
): Promise<TeacherAvailabilityRow[]> {
  const { data, error } = await supabase
    .from("teacher_availability")
    .select("*")
    .eq("teacher_id", teacherId)
    .eq("is_booked", false)
    .gt("start_time", new Date().toISOString())
    .order("start_time", { ascending: true })
    .limit(50);

  if (error) throw error;
  return data ?? [];
}

export async function listTeacherOwnSlots(
  supabase: SupabaseClient<Database>,
  teacherId: string,
): Promise<TeacherAvailabilityRow[]> {
  const { data, error } = await supabase
    .from("teacher_availability")
    .select("*")
    .eq("teacher_id", teacherId)
    .order("start_time", { ascending: true })
    .limit(100);

  if (error) throw error;
  return data ?? [];
}

export async function createAvailabilitySlot(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof createAvailabilitySlotSchema>,
) {
  const parsed = createAvailabilitySlotSchema.parse(input);

  if (new Date(parsed.endTime) <= new Date(parsed.startTime)) {
    throw new DomainForbiddenError("End time must be after start time.");
  }

  const { data, error } = await supabase
    .from("teacher_availability")
    .insert({
      teacher_id: parsed.teacherId,
      start_time: parsed.startTime,
      end_time: parsed.endTime,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAvailabilitySlot(
  supabase: SupabaseClient<Database>,
  slotId: string,
  teacherId: string,
) {
  const { data: slot, error: readError } = await supabase
    .from("teacher_availability")
    .select("id, teacher_id, is_booked")
    .eq("id", slotId)
    .maybeSingle();

  if (readError) throw readError;
  if (!slot || slot.teacher_id !== teacherId) {
    throw new DomainForbiddenError("Slot not found.");
  }
  if (slot.is_booked) {
    throw new DomainForbiddenError("Booked slots cannot be deleted.");
  }

  const { error } = await supabase.from("teacher_availability").delete().eq("id", slotId);
  if (error) throw error;
}

export async function bookAvailabilitySlot(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof bookSlotSchema>,
) {
  const parsed = bookSlotSchema.parse(input);

  const { data, error } = await supabase.rpc("book_availability_slot", {
    slot_id: parsed.slotId,
    parent_id: parsed.parentId,
    child_profile_id: parsed.childProfileId ?? undefined,
    area_id: parsed.areaId ?? undefined,
  });

  if (error) throw error;
  return data;
}

export async function updateBookingStatus(
  supabase: SupabaseClient<Database>,
  bookingId: string,
  teacherId: string,
  status: "completed" | "cancelled",
  options?: { progressScore?: number; progressFeedback?: string },
) {
  if (status === "completed") {
    const { data, error } = await supabase.rpc("complete_lesson_booking", {
      booking_id: bookingId,
      teacher_id: teacherId,
      progress_score: options?.progressScore ?? 85,
      progress_feedback: options?.progressFeedback ?? undefined,
    });
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase.rpc("cancel_lesson_booking", {
    booking_id: bookingId,
    actor_id: teacherId,
  });
  if (error) throw error;
  return data;
}

export async function cancelBookingAsParent(
  supabase: SupabaseClient<Database>,
  bookingId: string,
  parentId: string,
) {
  const { data, error } = await supabase.rpc("cancel_lesson_booking", {
    booking_id: bookingId,
    actor_id: parentId,
  });
  if (error) throw error;
  return data;
}

export type LessonBookingListItem = {
  id: string;
  teacher_id: string;
  parent_id: string;
  child_profile_id: string | null;
  start_time: string;
  end_time: string;
  status: "booked" | "completed" | "cancelled";
  payment_status?: "pending" | "parent_confirmed" | "teacher_confirmed" | "payment_confirmed" | "disputed";
  area_id: number | null;
  teacher?: { full_name: string } | null;
  parent?: { full_name: string } | null;
  live_lessons?: { meeting_url: string; status: string } | { meeting_url: string; status: string }[] | null;
};

export async function listBookingsForUser(
  supabase: SupabaseClient<Database>,
  userId: string,
  role: "parent" | "teacher",
): Promise<LessonBookingListItem[]> {
  const column = role === "parent" ? "parent_id" : "teacher_id";
  const { data, error } = await supabase
    .from("lesson_bookings")
    .select(
      `
      id,
      teacher_id,
      parent_id,
      child_profile_id,
      start_time,
      end_time,
      status,
      payment_status,
      area_id,
      teacher:teacher_id ( full_name ),
      parent:parent_id ( full_name ),
      live_lessons (
        meeting_url,
        status
      )
    `,
    )
    .eq(column, userId)
    .order("start_time", { ascending: false })
    .limit(30);

  if (error) throw error;
  return (data ?? []) as LessonBookingListItem[];
}
