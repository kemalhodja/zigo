import { z } from "zod";

export const lessonRequestStatusSchema = z.enum(["pending", "accepted", "rejected", "closed"]);

export const createLessonRequestSchema = z.object({
  senderId: z.string().uuid(),
  receiverId: z.string().uuid(),
  childProfileId: z.string().uuid().optional(),
  areaId: z.number().int().positive().optional(),
  messageBody: z.string().trim().min(10).max(2000),
  priority: z.enum(["normal", "urgent"]).optional().default("normal"),
});

export const updateLessonRequestStatusSchema = z.object({
  requestId: z.string().uuid(),
  actorId: z.string().uuid(),
  status: z.enum(["accepted", "rejected", "closed"]),
});

export const createLessonRequestMessageSchema = z.object({
  requestId: z.string().uuid(),
  senderId: z.string().uuid(),
  content: z.string().trim().min(1).max(2000),
});
