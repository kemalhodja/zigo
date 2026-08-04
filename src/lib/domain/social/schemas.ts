import { z } from "zod";

const isValidMediaUrl = (val: string) =>
  !val ||
  val.startsWith("http://") ||
  val.startsWith("https://") ||
  val.startsWith("data:") ||
  val.startsWith("blob:") ||
  val.startsWith("/");

const mediaUrlSchema = z
  .string()
  .refine(isValidMediaUrl, { message: "Geçerli bir medya URL veya veri adresi olmalıdır." })
  .optional()
  .nullable()
  .or(z.literal(""));

export const createSocialPostSchema = z.object({
  caption: z.string().trim().min(1, "Lütfen gönderi için bir açıklama yazın.").max(2200, "Açıklama en fazla 2200 karakter olabilir."),
  mediaUrl: mediaUrlSchema,
  mediaType: z.enum(["image", "video", "carousel"]).default("image"),
  isReel: z.coerce.boolean().default(false),
  areaId: z.preprocess(
    (val) => {
      const num = Number(val);
      return Number.isFinite(num) && num > 0 ? num : 1;
    },
    z.number().int().positive("Geçerli bir ders/konu alanı seçilmelidir."),
  ),
  targetAudience: z.enum(["all", "parent_only", "grade"]).default("all"),
  targetGrade: z.string().trim().optional().nullable(),
  postType: z.enum(["normal", "quiz", "micro"]).optional(),
  title: z.string().trim().max(255).optional().nullable().or(z.literal("")),
  content: z.string().trim().max(4000).optional().nullable().or(z.literal("")),
  quizId: z.string().uuid().optional().nullable().or(z.literal("")),
  premiumPrepLabel: z.string().trim().min(3).max(120).optional().nullable().or(z.literal("")),
  premiumPrepUrl: z.string().url().max(2048).optional().nullable().or(z.literal("")),
  sponsoredLabel: z.string().trim().min(3).max(120).optional().nullable().or(z.literal("")),
  sponsoredTargetUrl: z.string().url().max(2048).optional().nullable().or(z.literal("")),
  externalUrl: z.preprocess(
    (val) => {
      if (typeof val !== "string" || !val.trim()) return null;
      const trimmed = val.trim();
      return trimmed.startsWith("http://") || trimmed.startsWith("https://") ? trimmed : `https://${trimmed}`;
    },
    z.string().url().max(2048).optional().nullable(),
  ),
  coAuthorId: z.string().uuid().optional().nullable().or(z.literal("")),
  locationName: z.string().trim().max(150).optional().nullable().or(z.literal("")),
  city: z.string().trim().max(100).optional().nullable().or(z.literal("")),
  district: z.string().trim().max(100).optional().nullable().or(z.literal("")),
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

export const updateSocialPostSchema = z.object({
  postId: z.string().uuid(),
  caption: z.string().trim().min(1, "Lütfen gönderi için bir açıklama yazın.").max(2200, "Açıklama en fazla 2200 karakter olabilir.").optional(),
  title: z.string().trim().max(255).optional().nullable().or(z.literal("")),
  content: z.string().trim().max(4000).optional().nullable().or(z.literal("")),
  areaId: z.preprocess(
    (val) => {
      if (val === undefined || val === null) return undefined;
      const num = Number(val);
      return Number.isFinite(num) && num > 0 ? num : undefined;
    },
    z.number().int().positive("Geçerli bir ders/konu alanı seçilmelidir.").optional(),
  ),
  targetAudience: z.enum(["all", "parent_only", "grade"]).optional(),
  targetGrade: z.string().trim().optional().nullable(),
  externalUrl: z.preprocess(
    (val) => {
      if (val === undefined || val === null) return undefined;
      if (typeof val !== "string" || !val.trim()) return null;
      const trimmed = val.trim();
      return trimmed.startsWith("http://") || trimmed.startsWith("https://") ? trimmed : `https://${trimmed}`;
    },
    z.string().url().max(2048).optional().nullable(),
  ),
  locationName: z.string().trim().max(150).optional().nullable().or(z.literal("")),
  city: z.string().trim().max(100).optional().nullable().or(z.literal("")),
  district: z.string().trim().max(100).optional().nullable().or(z.literal("")),
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
  mediaUrl: mediaUrlSchema,
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

export const blockSchema = z.object({
  blockerId: z.string().uuid(),
  blockedId: z.string().uuid(),
});
