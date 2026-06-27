import { z } from "zod";

import { bookingStatusSchema } from "@/features/booking/types/schemas";
import { userRoleSchema } from "@/features/profile/types/schemas";

/**
 * Hand-maintained Zod mirrors of PostgreSQL contract tables.
 * Source of truth: supabase/migrations/*.sql + src/lib/supabase/database.types.ts
 * Regenerate checklist: npm run db:schemas:check
 */
export const dbUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string().min(2).max(100),
  role: userRoleSchema,
  is_verified: z.boolean(),
  total_points: z.number().int().nonnegative(),
  created_at: z.string(),
});

export const dbLessonBookingSchema = z.object({
  id: z.string().uuid(),
  teacher_id: z.string().uuid(),
  parent_id: z.string().uuid(),
  child_profile_id: z.string().uuid().nullable(),
  start_time: z.string(),
  end_time: z.string(),
  status: bookingStatusSchema,
  area_id: z.number().int().nullable(),
});

export const dbTeacherAvailabilitySchema = z.object({
  id: z.string().uuid(),
  teacher_id: z.string().uuid(),
  start_time: z.string(),
  end_time: z.string(),
  is_booked: z.boolean(),
});

export const dbStudentNeedSchema = z.object({
  id: z.string().uuid(),
  student_user_id: z.string().uuid().nullable(),
  child_profile_id: z.string().uuid().nullable(),
  area_id: z.number().int().positive(),
  weakness_level: z.number().int().min(1).max(5),
});

export const dbPostSchema = z.object({
  id: z.string().uuid(),
  teacher_id: z.string().uuid(),
  title: z.string().nullable(),
  content: z.string().nullable(),
  media_url: z.string().nullable(),
  area_id: z.number().int().nullable(),
  created_at: z.string(),
});

export const dbQuestionSchema = z.object({
  id: z.string().uuid(),
  author_id: z.string().uuid(),
  area_id: z.number().int().nullable(),
  title: z.string(),
  description: z.string(),
  is_resolved: z.boolean(),
  created_at: z.string(),
});

export type DbUser = z.infer<typeof dbUserSchema>;
export type DbLessonBooking = z.infer<typeof dbLessonBookingSchema>;
