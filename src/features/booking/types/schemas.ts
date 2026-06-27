import { z } from "zod";

export {
  bookSlotSchema,
  createAvailabilitySlotSchema,
  type LessonBookingListItem,
  type TeacherAvailabilityRow,
} from "@/lib/domain/ecosystem/calendar";

export const bookingStatusSchema = z.enum(["booked", "completed", "cancelled"]);

export const createBookingRequestSchema = z.object({
  slotId: z.string().uuid(),
  childProfileId: z.string().uuid().optional(),
  areaId: z.coerce.number().int().positive().optional(),
});

export const updateBookingRequestSchema = z.object({
  bookingId: z.string().uuid(),
  status: bookingStatusSchema,
  progressScore: z.coerce.number().int().min(0).max(100).optional(),
  progressFeedback: z.string().trim().max(500).optional(),
});

export const bookingListItemSchema = z.object({
  id: z.string().uuid(),
  teacher_id: z.string().uuid(),
  parent_id: z.string().uuid(),
  child_profile_id: z.string().uuid().nullable(),
  start_time: z.string(),
  end_time: z.string(),
  status: bookingStatusSchema,
  area_id: z.number().nullable(),
  teacher: z.object({ full_name: z.string() }).nullable().optional(),
  parent: z.object({ full_name: z.string() }).nullable().optional(),
});

export const bookingListResponseSchema = z.object({
  data: z.array(bookingListItemSchema),
});

export const availabilitySlotSchema = z.object({
  id: z.string().uuid(),
  teacher_id: z.string().uuid(),
  start_time: z.string(),
  end_time: z.string(),
  is_booked: z.boolean(),
  created_at: z.string().optional(),
});

export const availabilityListResponseSchema = z.object({
  data: z.array(availabilitySlotSchema),
});

export const createAvailabilityBodySchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
});

export const availabilityTeacherQuerySchema = z.object({
  teacherId: z.string().uuid().optional(),
});

export const deleteAvailabilityQuerySchema = z.object({
  id: z.string().uuid(),
});

export type BookingStatus = z.infer<typeof bookingStatusSchema>;
export type CreateBookingRequest = z.infer<typeof createBookingRequestSchema>;
export type UpdateBookingRequest = z.infer<typeof updateBookingRequestSchema>;
export type TeacherAvailabilitySlot = z.infer<typeof availabilitySlotSchema>;
