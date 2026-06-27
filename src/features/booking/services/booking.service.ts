import type { SupabaseClient } from "@supabase/supabase-js";

import type { CreateBookingRequest, UpdateBookingRequest } from "@/features/booking/types";
import {
  bookAvailabilitySlot,
  cancelBookingAsParent,
  createAvailabilitySlot,
  deleteAvailabilitySlot,
  type LessonBookingListItem,
  listBookingsForUser,
  listTeacherOpenSlots,
  listTeacherOwnSlots,
  updateBookingStatus,
} from "@/lib/domain/ecosystem/calendar";
import type { Database, UserRole } from "@/lib/supabase/database.types";

export async function fetchBookingsForUser(
  supabase: SupabaseClient<Database>,
  userId: string,
  role: Extract<UserRole, "parent" | "teacher">,
): Promise<LessonBookingListItem[]> {
  return listBookingsForUser(supabase, userId, role);
}

export async function fetchTeacherOpenSlots(
  supabase: SupabaseClient<Database>,
  teacherId: string,
) {
  return listTeacherOpenSlots(supabase, teacherId);
}

export async function createBooking(
  supabase: SupabaseClient<Database>,
  parentId: string,
  input: CreateBookingRequest,
) {
  return bookAvailabilitySlot(supabase, {
    slotId: input.slotId,
    parentId,
    childProfileId: input.childProfileId,
    areaId: input.areaId,
  });
}

export async function cancelBooking(
  supabase: SupabaseClient<Database>,
  bookingId: string,
  parentId: string,
) {
  return cancelBookingAsParent(supabase, bookingId, parentId);
}

export async function updateBooking(
  supabase: SupabaseClient<Database>,
  teacherId: string,
  input: UpdateBookingRequest,
) {
  if (input.status === "cancelled" || input.status === "completed") {
    return updateBookingStatus(supabase, input.bookingId, teacherId, input.status, {
      progressScore: input.progressScore,
      progressFeedback: input.progressFeedback,
    });
  }

  throw new Error("Unsupported booking status.");
}

export {
  createAvailabilitySlot,
  deleteAvailabilitySlot,
  listTeacherOwnSlots,
};

export function assertNoBookingTimeConflict(
  bookings: Pick<LessonBookingListItem, "start_time" | "end_time" | "status">[],
  candidate: { startTime: string; endTime: string },
): boolean {
  const candidateStart = new Date(candidate.startTime).getTime();
  const candidateEnd = new Date(candidate.endTime).getTime();

  if (candidateEnd <= candidateStart) {
    return false;
  }

  return !bookings.some((booking) => {
    if (booking.status === "cancelled") return false;
    const start = new Date(booking.start_time).getTime();
    const end = new Date(booking.end_time).getTime();
    return candidateStart < end && candidateEnd > start;
  });
}
