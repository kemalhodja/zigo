import { z } from "zod";

export {
  commentSchema,
  contentReportSchema,
  contentReportStatusSchema,
  createSocialPostSchema,
  createStorySchema,
  followSchema,
  moderationActionSchema,
  socialPostActionSchema,
  storyReplySchema,
} from "@/lib/domain/social/schemas";

export const socialFeedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(30),
  offset: z.coerce.number().int().min(0).default(0),
  cursor: z.string().optional(),
  postType: z.string().optional(),
});

export const commentsQuerySchema = z.object({
  postId: z.string().uuid(),
});

export const cleanupUploadSchema = z.object({
  objectPath: z.string().min(3).max(500),
});
