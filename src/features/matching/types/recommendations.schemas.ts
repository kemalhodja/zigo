import { z } from "zod";

export const recommendationsQuerySchema = z.object({
  childProfileId: z.string().uuid().optional(),
  studentUserId: z.string().uuid().optional(),
  subject: z.string().trim().min(1).max(100).optional(),
  limit: z.coerce.number().int().min(1).max(20).default(5),
  autoAnalyze: z
    .enum(["true", "false", "1", "0"])
    .optional()
    .transform((value) => value !== "false" && value !== "0"),
});

export const smartRecommendationsResponseSchema = z.object({
  sessionsAnalyzed: z.number(),
  weaknesses: z.array(
    z.object({
      areaId: z.number(),
      areaName: z.string(),
      averageScore: z.number(),
      weaknessLevel: z.number(),
      sampleCount: z.number(),
    }),
  ),
  teachers: z.array(
    z.object({
      teacher_id: z.string().uuid(),
      full_name: z.string(),
      reputation_score: z.number(),
      matched_area_id: z.number(),
      area_name: z.string(),
      weakness_level: z.number(),
      match_score: z.number(),
    }),
  ),
});
