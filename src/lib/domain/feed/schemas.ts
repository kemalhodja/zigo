import { z } from "zod";

export const createPostSchema = z.object({
  teacherId: z.string().uuid(),
  areaId: z.coerce.number().int().positive(),
  title: z.string().trim().min(3).max(255),
  content: z.string().trim().min(10).max(4000),
  mediaUrl: z.string().url().optional().or(z.literal("")),
  postType: z.enum(["normal", "micro"]).optional(),
});
