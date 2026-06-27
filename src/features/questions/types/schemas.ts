import { z } from "zod";

export {
  createAnswerSchema,
  createQuestionSchema,
} from "@/lib/domain/questions/schemas";

export const createQuestionBodySchema = z.object({
  areaId: z.coerce.number().int().positive(),
  title: z.string().trim().min(3).max(255),
  description: z.string().trim().min(10).max(4000),
});

export const createAnswerBodySchema = z.object({
  questionId: z.string().uuid(),
  content: z.string().trim().min(10).max(4000),
});

export const questionListResponseSchema = z.object({
  data: z.array(
    z.object({
      id: z.string().uuid(),
      title: z.string(),
      description: z.string(),
      area_id: z.number().nullable(),
      is_resolved: z.boolean(),
      created_at: z.string(),
    }),
  ),
});
