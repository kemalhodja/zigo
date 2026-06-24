import { z } from "zod";

export const createQuizSchema = z.object({
  teacherId: z.string().uuid(),
  areaId: z.coerce.number().int().positive(),
  title: z.string().trim().min(3).max(255),
  questionText: z.string().trim().min(10).max(1000),
  options: z.array(z.string().trim().min(1).max(255)).min(2).max(6),
  correctOption: z.coerce.number().int().min(0),
  pointsReward: z.coerce.number().int().min(1).max(100).default(10),
});

export const submitQuizSchema = z.object({
  quizId: z.string().uuid(),
  selectedOption: z.coerce.number().int().min(0).optional(),
  answers: z
    .array(
      z.object({
        questionId: z.string().uuid(),
        selectedOption: z.coerce.number().int().min(0),
      }),
    )
    .min(1)
    .optional(),
  childProfileId: z.string().uuid().optional(),
}).refine(
  (value) => value.selectedOption !== undefined || (value.answers && value.answers.length > 0),
  { message: "Provide selectedOption or answers." },
);

export const completeVideoSchema = z.object({
  postId: z.string().uuid(),
  secondsWatched: z.coerce.number().int().min(60).default(60),
  childProfileId: z.string().uuid().optional(),
});

export const completeSafeDuelSchema = z.object({
  duelId: z.string().uuid(),
  score: z.coerce.number().int().min(0),
  totalQuestions: z.coerce.number().int().min(1).max(10).default(3),
  areaId: z.coerce.number().int().positive().optional(),
});
