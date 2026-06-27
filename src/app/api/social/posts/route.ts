import { revalidateTag } from "next/cache";

import { getUserInterestAreaIds } from "@/features/profile/services";
import {
  createSocialPost,
  createSocialPostSchema,
  getSocialFeed,
  SOCIAL_FEED_CACHE_TAG,
  socialFeedCacheTag,
  socialFeedQuerySchema,
} from "@/features/social";
import {
  isErrorResponse,
  jsonError,
  jsonSuccessWithMeta,
  requireAuthenticatedProfile,
} from "@/features/shared";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { getUserSubscription } from "@/lib/domain/subscription";
import {
  assertTeacherCreatorPlus,
  socialPostRequiresTeacherCreatorPlus,
} from "@/lib/domain/teacher-creator-plus";
import { createClient } from "@/lib/supabase/server";

export const GET = withApiHandler(async (request: Request) => {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  const searchParams = new URL(request.url).searchParams;
  const parsed = socialFeedQuerySchema.parse({
    limit: searchParams.get("limit") ?? undefined,
    offset: searchParams.get("offset") ?? undefined,
    cursor: searchParams.get("cursor") ?? undefined,
    postType: searchParams.get("postType") ?? undefined,
  });

  const postTypes = parsed.postType
    ? parsed.postType.split(",").filter((value): value is "normal" | "quiz" | "micro" =>
        value === "normal" || value === "quiz" || value === "micro",
      )
    : undefined;

  const page = await getSocialFeed(supabase, profile?.id, {
    limit: parsed.limit,
    cursor: parsed.cursor,
    offset: parsed.cursor ? undefined : parsed.offset,
    postTypes,
  });

  return jsonSuccessWithMeta(page.posts, {
    count: page.posts.length,
    hasMore: Boolean(page.nextCursor),
    limit: parsed.limit,
    offset: parsed.cursor ? undefined : parsed.offset,
    nextCursor: page.nextCursor,
  });
}, { fallbackMessage: "Social posts could not be loaded." });

export const POST = withApiHandler(async (request: Request) => {
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase, {
    roles: ["teacher"],
    requireVerified: true,
  });
  if (isErrorResponse(profileOrError)) return profileOrError;

  const body = createSocialPostSchema.parse(await request.json());
  const teacherAreaIds = await getUserInterestAreaIds(supabase, profileOrError.id);

  if (!teacherAreaIds.includes(body.areaId)) {
    return jsonError("Teachers can publish only in assigned education areas.", 403, "FORBIDDEN");
  }

  const subscription = await getUserSubscription(supabase, profileOrError.id);
  if (socialPostRequiresTeacherCreatorPlus(body)) {
    if (body.premiumPrepLabel || body.premiumPrepUrl) {
      assertTeacherCreatorPlus(subscription, profileOrError.role, "yazılı hazırlık linki");
    }
    if (body.sponsoredLabel || body.sponsoredTargetUrl) {
      assertTeacherCreatorPlus(subscription, profileOrError.role, "sponsorlu reklam");
    }
    if (body.postType === "quiz" || body.quizId) {
      assertTeacherCreatorPlus(subscription, profileOrError.role, "quiz gönderisi");
    }
  }

  const post = await createSocialPost(supabase, {
    authorId: profileOrError.id,
    caption: body.caption,
    mediaUrl: body.mediaUrl ?? "",
    mediaType: body.mediaType,
    isReel: body.isReel,
    areaId: body.areaId,
    postType: body.postType,
    title: body.title,
    content: body.content,
    quizId: body.quizId,
    premiumPrepLabel: body.premiumPrepLabel,
    premiumPrepUrl: body.premiumPrepUrl,
    sponsoredLabel: body.sponsoredLabel,
    sponsoredTargetUrl: body.sponsoredTargetUrl,
  });

  revalidateTag(SOCIAL_FEED_CACHE_TAG, "max");
  revalidateTag(socialFeedCacheTag(profileOrError.id), "max");

  return jsonSuccessWithMeta(post, { action: "create-post", areaId: body.areaId }, 201);
}, { fallbackMessage: "Post could not be published." });
