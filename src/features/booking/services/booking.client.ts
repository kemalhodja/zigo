import {
  availabilityListResponseSchema,
  bookingListResponseSchema,
  type CreateBookingRequest,
  type LessonBookingListItem,
  type TeacherAvailabilitySlot,
} from "@/features/booking/types";
import { fetchJson } from "@/features/shared/api/client-fetch";

export async function fetchBookingsClient(): Promise<LessonBookingListItem[]> {
  const body = await fetchJson<unknown>("/api/ecosystem/bookings");
  return bookingListResponseSchema.parse(body).data;
}

export async function createBookingClient(
  input: CreateBookingRequest,
): Promise<LessonBookingListItem> {
  const body = await fetchJson<{ data: LessonBookingListItem }>("/api/ecosystem/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return body.data;
}

export async function cancelBookingClient(bookingId: string): Promise<void> {
  await fetchJson("/api/ecosystem/bookings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bookingId, status: "cancelled" }),
  });
}

export async function fetchTeacherOwnSlotsClient(): Promise<TeacherAvailabilitySlot[]> {
  const body = await fetchJson<unknown>("/api/ecosystem/availability");
  return availabilityListResponseSchema.parse(body).data;
}

export async function fetchTeacherOpenSlotsClient(teacherId: string): Promise<TeacherAvailabilitySlot[]> {
  const body = await fetchJson<unknown>(`/api/ecosystem/availability?teacherId=${teacherId}`);
  return availabilityListResponseSchema.parse(body).data;
}

export async function createAvailabilitySlotClient(input: {
  startTime: string;
  endTime: string;
}): Promise<TeacherAvailabilitySlot> {
  const body = await fetchJson<{ data: TeacherAvailabilitySlot }>("/api/ecosystem/availability", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return body.data;
}

export async function deleteAvailabilitySlotClient(slotId: string): Promise<void> {
  await fetchJson(`/api/ecosystem/availability?id=${slotId}`, { method: "DELETE" });
}

export async function updateBookingStatusClient(input: {
  bookingId: string;
  status: "completed" | "cancelled";
  progressScore?: number;
  progressFeedback?: string;
}): Promise<void> {
  await fetchJson("/api/ecosystem/bookings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}
