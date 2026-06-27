import { z } from "zod";

export {
  type MatchedTeacher,
  upsertStudentNeedSchema,
} from "@/lib/domain/ecosystem/matching";

export const matchingQuerySchema = z.object({
  childProfileId: z.string().uuid().optional(),
  studentUserId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(20).default(5),
});

export const upsertStudentNeedBodySchema = z.object({
  childProfileId: z.string().uuid().optional(),
  studentUserId: z.string().uuid().optional(),
  areaId: z.coerce.number().int().positive(),
  weaknessLevel: z.coerce.number().int().min(1).max(5),
});

export const matchedTeacherSchema = z.object({
  teacher_id: z.string().uuid(),
  full_name: z.string(),
  reputation_score: z.number(),
  matched_area_id: z.number(),
  area_name: z.string(),
  weakness_level: z.number(),
  match_score: z.number(),
});

export const matchingListResponseSchema = z.object({
  data: z.array(matchedTeacherSchema),
});

export const weeklyProgressQuerySchema = z.object({
  childProfileId: z.string().uuid().optional(),
});
