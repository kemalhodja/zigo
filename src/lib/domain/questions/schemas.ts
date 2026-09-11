import { z } from "zod";

export const createQuestionSchema = z.object({
  authorId: z.string().uuid(),
  areaId: z.coerce.number().int().positive(),
  title: z.string().trim().min(3).max(255),
  description: z.string().trim().min(5).max(4000),
  imageUrl: z.string().url().nullable().optional(),
});

export const createAnswerSchema = z.object({
  questionId: z.string().uuid(),
  teacherId: z.string().uuid(),
  content: z.string().trim().min(5).max(4000),
  videoUrl: z.string().url().nullable().optional(),
  audioUrl: z.string().url().nullable().optional(),
  mediaDurationSec: z.number().int().nonnegative().nullable().optional(),
});
