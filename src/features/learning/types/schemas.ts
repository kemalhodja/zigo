import { z } from "zod";

export {
  completeSafeDuelSchema,
  completeVideoSchema,
  createQuizSchema,
  submitQuizSchema,
} from "@/lib/domain/learning/schemas";
export { submitQuizSchema as submitQuizBodySchema } from "@/lib/domain/learning/schemas";
export { completeVideoSchema as completeVideoBodySchema } from "@/lib/domain/learning/schemas";

export const createQuizBodySchema = z.object({
  areaId: z.coerce.number().int().positive(),
  title: z.string().trim().min(3).max(255),
  questionText: z.string().trim().min(10).max(1000),
  options: z.array(z.string().trim().min(1).max(255)).min(2).max(6),
  correctOption: z.coerce.number().int().min(0),
  pointsReward: z.coerce.number().int().min(1).max(100).default(10),
});

export const quizIdParamSchema = z.object({
  quizId: z.string().uuid(),
});
