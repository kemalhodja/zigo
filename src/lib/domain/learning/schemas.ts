import { z } from "zod";

/** Professional teacher quizzes ship with exactly 10 scored items. */
export const TEACHER_QUIZ_QUESTION_COUNT = 10;
export const TEACHER_QUIZ_OPTION_COUNT = 4;

export const quizQuestionInputSchema = z.object({
  questionText: z.string().trim().min(10).max(1000),
  options: z
    .array(z.string().trim().min(1).max(255))
    .length(TEACHER_QUIZ_OPTION_COUNT),
  correctOption: z.coerce.number().int().min(0).max(TEACHER_QUIZ_OPTION_COUNT - 1),
  imageUrl: z.string().url().optional(), // optional image URL
});

export const createQuizSchema = z
  .object({
    teacherId: z.string().uuid(),
    areaId: z.coerce.number().int().positive(),
    title: z.string().trim().min(3).max(255),
    questions: z.array(quizQuestionInputSchema).length(TEACHER_QUIZ_QUESTION_COUNT),
    pointsReward: z.coerce.number().int().min(10).max(200).default(100),
  })
  .superRefine((value, ctx) => {
    value.questions.forEach((question, index) => {
      if (question.correctOption >= question.options.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Question ${index + 1}: correct option must match one of the options.`,
          path: ["questions", index, "correctOption"],
        });
      }

      const uniqueOptions = new Set(question.options.map((option) => option.toLocaleLowerCase("tr-TR")));
      if (uniqueOptions.size !== question.options.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Question ${index + 1}: options must be unique.`,
          path: ["questions", index, "options"],
        });
      }
    });
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

export const shareStudyMomentSchema = z.object({
  sessionId: z.string().uuid(),
  caption: z.string().trim().max(280).optional(),
});
