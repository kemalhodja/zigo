import { z } from "zod";

export const createSocialPostSchema = z.object({
  caption: z.string().trim().min(1).max(2200),
  mediaUrl: z.string().url().optional().or(z.literal("")),
  mediaType: z.enum(["image", "video", "carousel"]).default("image"),
  isReel: z.coerce.boolean().default(false),
  areaId: z.coerce.number().int().positive(),
  postType: z.enum(["normal", "quiz", "micro"]).optional(),
  title: z.string().trim().max(255).optional(),
  content: z.string().trim().max(4000).optional(),
  quizId: z.string().uuid().optional(),
  premiumPrepLabel: z.string().trim().min(3).max(120).optional(),
  premiumPrepUrl: z.string().url().max(2048).optional(),
  sponsoredLabel: z.string().trim().min(3).max(120).optional(),
  sponsoredTargetUrl: z.string().url().max(2048).optional(),
}).superRefine((value, ctx) => {
  const hasLabel = Boolean(value.premiumPrepLabel?.trim());
  const hasUrl = Boolean(value.premiumPrepUrl?.trim());
  if (hasLabel !== hasUrl) {
    ctx.addIssue({
      code: "custom",
      message: "Premium prep label and URL must be provided together.",
      path: hasLabel ? ["premiumPrepUrl"] : ["premiumPrepLabel"],
    });
  }

  const hasSponsorLabel = Boolean(value.sponsoredLabel?.trim());
  const hasSponsorUrl = Boolean(value.sponsoredTargetUrl?.trim());
  if (hasSponsorLabel !== hasSponsorUrl) {
    ctx.addIssue({
      code: "custom",
      message: "Sponsored label and target URL must be provided together.",
      path: hasSponsorLabel ? ["sponsoredTargetUrl"] : ["sponsoredLabel"],
    });
  }
});

export const socialPostActionSchema = z.object({
  postId: z.string().uuid(),
});

export const reelWatchCompletionSchema = socialPostActionSchema.extend({
  secondsWatched: z.coerce.number().int().min(60),
});

export const commentSchema = socialPostActionSchema.extend({
  content: z.string().trim().min(1).max(1000),
});

export const followSchema = z.object({
  followingId: z.string().uuid(),
});

export const createStorySchema = z.object({
  caption: z.string().trim().max(500).optional().or(z.literal("")),
  mediaUrl: z.string().url().optional().or(z.literal("")),
  areaId: z.coerce.number().int().positive(),
});

export const storyReplySchema = z.object({
  storyId: z.string().uuid(),
  content: z.string().trim().min(1).max(1000),
});

export const contentReportSchema = z.object({
  postId: z.string().uuid(),
  reason: z
    .enum(["safety_review", "misinformation", "bullying", "inappropriate", "other"])
    .default("safety_review"),
  details: z.string().trim().max(500).optional(),
});

export const moderationActionSchema = z.object({
  itemId: z.string().uuid(),
  kind: z.enum(["comment", "story_reply"]),
  status: z.enum(["approved", "rejected"]),
});

export const contentReportStatusSchema = z.object({
  reportId: z.string().uuid(),
  status: z.enum(["open", "reviewing", "resolved", "dismissed"]),
});
