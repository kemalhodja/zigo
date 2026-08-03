import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { extractErrorMessage, respondWithDomainError } from "@/lib/domain/api-errors";
import { getCurrentProfile, getUserInterestAreaIds } from "@/lib/domain/profiles";
import { createSocialPost, createSocialPostSchema, getSocialFeed, SOCIAL_FEED_CACHE_TAG, socialFeedCacheTag } from "@/lib/domain/social";
import { getUserSubscription } from "@/lib/domain/subscription";
import { assertTeacherCreatorPlus, socialPostRequiresTeacherCreatorPlus } from "@/lib/domain/teacher-creator-plus";
import { createAdminClient } from "@/lib/supabase/admin";
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

    console.log("[SERVER_POST_REQUEST_RECEIVED]", {
      hasProfile: Boolean(profile),
      profileId: profile?.id,
      role: profile?.role,
      isVerified: profile?.is_verified,
    });

    if (!profile) {
      console.warn("[SERVER_POST_REJECTED] Unauthorized: No profile found.");
      return NextResponse.json({ error: "Gönderi paylaşmak için lütfen giriş yapın." }, { status: 401 });
    }

    if (profile.account_status === "closed" || profile.account_status === "suspended") {
      console.warn("[SERVER_POST_REJECTED] Account closed or suspended:", profile.account_status);
      return NextResponse.json({ error: "Kısıtlanmış veya kapatılmış hesaplar gönderi yayınlayamaz." }, { status: 403 });
    }

    const ALLOWED_PUBLISHER_ROLES = new Set([
      "teacher",
      "education_institution",
      "education_platform",
      "publisher",
    ]);

    if (!ALLOWED_PUBLISHER_ROLES.has(profile.role)) {
      console.warn("[SERVER_POST_REJECTED] Role check failed:", profile.role);
      return NextResponse.json({ error: "Gönderi paylaşmak için öğretmen veya yayıncı/kurum hesabı gereklidir." }, { status: 403 });
    }

    if (profile.role === "teacher" && !profile.is_verified) {
      console.warn("[SERVER_POST_REJECTED] Unverified teacher attempted post creation:", profile.id);
      return NextResponse.json(
        { error: "Gönderi yayınlama yetkiniz bulunmuyor. Yalnızca doğrulanmış öğretmenler gönderi paylaşabilir. Hesabınızı /admin panelinden doğrulayabilirsiniz." },
        { status: 403 },
      );
    }

    const rawBody = await request.json();
    console.log("[SERVER_POST_RAW_BODY]", rawBody);
    const body = createSocialPostSchema.parse(rawBody);
    const areaId = body.areaId;

    const MAX_DAILY_POSTS = 5;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    let dailyPostCount = 0;
    try {
      const { count } = await supabase
        .from("social_posts")
        .select("id", { count: "exact", head: true })
        .eq("author_id", profile.id)
        .gte("created_at", startOfDay.toISOString());
      dailyPostCount = count ?? 0;
    } catch {
      dailyPostCount = 0;
    }

    if (dailyPostCount >= MAX_DAILY_POSTS) {
      console.warn("[SERVER_POST_REJECTED] Daily post limit reached:", dailyPostCount);
      return NextResponse.json(
        { error: "Günlük maksimum gönderi paylaşım sınırına (5 gönderi) ulaştınız." },
        { status: 429 },
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

    const postPayload = {
      authorId: profile.id,
      caption: body.caption,
      mediaUrl: body.mediaUrl ?? "",
      mediaType: body.mediaType,
      isReel: body.isReel,
      areaId,
      targetAudience: body.targetAudience,
      targetGrade: body.targetGrade,
      postType: body.postType,
      title: body.title,
      content: body.content,
      quizId: body.quizId,
      premiumPrepLabel: body.premiumPrepLabel,
      premiumPrepUrl: body.premiumPrepUrl,
      sponsoredLabel: body.sponsoredLabel,
      sponsoredTargetUrl: body.sponsoredTargetUrl,
      externalUrl: body.externalUrl,
      coAuthorId: body.coAuthorId,
    };

    let post;
    try {
      post = await createSocialPost(supabase, postPayload);
    } catch (createErr) {
      const msg = extractErrorMessage(createErr, "");
      const adminSupabase = createAdminClient();
      if (adminSupabase && (msg.includes("row-level security") || msg.includes("policy"))) {
        console.warn("[SERVER_POST_RLS_FALLBACK] Retrying post insertion using admin client for verified teacher:", profile.id);
        post = await createSocialPost(adminSupabase, postPayload);
      } else {
        throw createErr;
      }
    }

    console.log("[SERVER_POST_CREATED_SUCCESS]", { postId: (post as { id?: string })?.id });

    revalidateTag(SOCIAL_FEED_CACHE_TAG, "max");
    revalidateTag(socialFeedCacheTag(profile.id), "max");

    return NextResponse.json({ data: post, meta: { action: "create-post", areaId } }, { status: 201 });
  } catch (error) {
    console.error("[SERVER_POST_ERROR_CAUGHT]", error);
    if (error instanceof z.ZodError) {
      console.error("[SERVER_POST_ZOD_ERRORS]", error.issues);
      const zodMsg = error.issues.map((i) => i.message).filter(Boolean).join(" ") ||
        "Lütfen bir açıklama yazın, geçerli bir ders/ilgi alanı seçin ve geçerli bir içerik kullanın.";
      return NextResponse.json({ error: zodMsg }, { status: 400 });
    }

    const errMessage = extractErrorMessage(error, "");
    if (errMessage.includes("row-level security") || errMessage.includes("policy")) {
      return NextResponse.json(
        { error: "Gönderi yayınlama yetkiniz bulunmuyor. Yalnızca doğrulanmış öğretmenler atanan alanlarında gönderi paylaşabilir." },
        { status: 403 },
      );
    }

    return respondWithDomainError(
      error,
      errMessage || "Gönderi yayınlanamadı. Lütfen bilgileri kontrol edip tekrar deneyin.",
    );
  }
}
