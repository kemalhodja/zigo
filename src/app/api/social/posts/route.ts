import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { respondWithDomainError } from "@/lib/domain/api-errors";
import { getCurrentProfile, getUserInterestAreaIds } from "@/lib/domain/profiles";
import { createSocialPost, createSocialPostSchema, getSocialFeed, SOCIAL_FEED_CACHE_TAG, socialFeedCacheTag } from "@/lib/domain/social";
import { getUserSubscription } from "@/lib/domain/subscription";
import {
  assertTeacherCreatorPlus,
  socialPostRequiresTeacherCreatorPlus,
} from "@/lib/domain/teacher-creator-plus";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    const searchParams = new URL(request.url).searchParams;
    const rawLimit = Number(searchParams.get("limit") ?? 30);
    const rawOffset = Number(searchParams.get("offset") ?? 0);
    const cursor = searchParams.get("cursor");
    const postTypeParam = searchParams.get("postType");
    const postTypes = postTypeParam
      ? postTypeParam.split(",").filter((value): value is "normal" | "quiz" | "micro" =>
          value === "normal" || value === "quiz" || value === "micro",
        )
      : undefined;
    const limit = Number.isFinite(rawLimit) ? Math.min(50, Math.max(1, rawLimit)) : 30;
    const offset = Number.isFinite(rawOffset) ? Math.max(0, rawOffset) : 0;
    const page = await getSocialFeed(supabase, profile?.id, {
      limit,
      cursor: cursor ?? undefined,
      offset: cursor ? undefined : offset,
      postTypes,
    });

    return NextResponse.json({
      data: page.posts,
      meta: {
        count: page.posts.length,
        hasMore: Boolean(page.nextCursor),
        limit,
        offset: cursor ? undefined : offset,
        nextCursor: page.nextCursor,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Social posts could not be loaded.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (profile.role !== "teacher" || !profile.is_verified) {
      return NextResponse.json({ error: "Only verified teachers can publish posts." }, { status: 403 });
    }

    const body = createSocialPostSchema.parse(await request.json());
    const teacherAreaIds = await getUserInterestAreaIds(supabase, profile.id);
    const areaId = body.areaId;

    if (!teacherAreaIds.includes(areaId)) {
      return NextResponse.json(
        { error: "Teachers can publish only in assigned education areas." },
        { status: 403 },
      );
    }

    const subscription = await getUserSubscription(supabase, profile.id);
    if (socialPostRequiresTeacherCreatorPlus(body)) {
      if (body.premiumPrepLabel || body.premiumPrepUrl) {
        assertTeacherCreatorPlus(subscription, profile.role, "yazılı hazırlık linki");
      }
      if (body.sponsoredLabel || body.sponsoredTargetUrl) {
        assertTeacherCreatorPlus(subscription, profile.role, "sponsorlu reklam");
      }
      if (body.postType === "quiz" || body.quizId) {
        assertTeacherCreatorPlus(subscription, profile.role, "quiz gönderisi");
      }
    }

    const post = await createSocialPost(supabase, {
      authorId: profile.id,
      caption: body.caption,
      mediaUrl: body.mediaUrl ?? "",
      mediaType: body.mediaType,
      isReel: body.isReel,
      areaId,
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
    revalidateTag(socialFeedCacheTag(profile.id), "max");

    return NextResponse.json({ data: post, meta: { action: "create-post", areaId } }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Add a caption, choose an assigned education area, and use a valid media URL/type." },
        { status: 400 },
      );
    }

    return respondWithDomainError(error, "Post could not be published.");
  }
}
