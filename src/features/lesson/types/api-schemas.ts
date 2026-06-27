import { z } from "zod";

export type { LessonRequestRow } from "@/lib/domain/lesson-requests/queries";
export {
  createLessonRequestMessageSchema,
  createLessonRequestSchema,
  lessonRequestStatusSchema,
  updateLessonRequestStatusSchema,
} from "@/lib/domain/lesson-requests/schemas";

export const createLessonRequestBodySchema = z.object({
  receiverId: z.string().uuid(),
  childProfileId: z.string().uuid().optional(),
  areaId: z.coerce.number().int().positive().optional(),
  messageBody: z.string().trim().min(10).max(2000),
  priority: z.enum(["normal", "urgent"]).optional().default("normal"),
});

export const updateLessonRequestBodySchema = z.object({
  status: z.enum(["accepted", "rejected", "closed"]),
});

export const createLessonRequestMessageBodySchema = z.object({
  content: z.string().trim().min(1).max(2000),
});

export type CreateLessonRequestBody = z.infer<typeof createLessonRequestBodySchema>;
