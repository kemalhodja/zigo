import type { SupabaseClient } from "@supabase/supabase-js";

import {
  assertModeratedOptionalTextAsync,
} from "@/lib/domain/moderation";
import {
  runModeratedFieldsAction,
  runModeratedOptionalTextAction,
  runModeratedPublishAction,
} from "@/lib/domain/moderation-policy";
import {
  countApprovedComments,
  countFollowers,
  countFollowing,
  countPostLikes,
  countPostSaves,
  hasFollow,
  hasRow,
  notifyPostAuthor,
} from "@/lib/domain/social/helpers";
import {
  commentSchema,
  contentReportSchema,
  createSocialPostSchema,
  createStorySchema,
  followSchema,
  reelWatchCompletionSchema,
  socialPostActionSchema,
  storyReplySchema,
  updateSocialPostSchema,
} from "@/lib/domain/social/schemas";
import type { LearningAwardResult, UserContentReport } from "@/lib/domain/social/types";
import type {
  ContentPostType,
  Database,
  SocialMediaType,
  UserRow,
} from "@/lib/supabase/database.types";

export async function createSocialPost(
  supabase: SupabaseClient<Database>,
  input: {
    authorId: string;
    caption: string;
    mediaUrl?: string | null;
    mediaType?: SocialMediaType;
    isReel?: boolean;
    areaId: number;
    targetAudience?: "all" | "parent_only" | "grade";
    targetGrade?: string | null;
    postType?: ContentPostType;
    title?: string | null;
    content?: string | null;
    quizId?: string | null;
    premiumPrepLabel?: string | null;
    premiumPrepUrl?: string | null;
    sponsoredLabel?: string | null;
    sponsoredTargetUrl?: string | null;
    externalUrl?: string | null;
    coAuthorId?: string | null;
    locationName?: string | null;
    city?: string | null;
    district?: string | null;
  },
) {
  const parsed = createSocialPostSchema.parse(input);
  const postType =
    parsed.postType ??
    (parsed.quizId ? "quiz" : parsed.isReel || parsed.mediaType === "video" ? "micro" : "normal");

  const fields = [{ label: "caption", text: parsed.caption }];
  if (parsed.title) fields.push({ label: "title", text: parsed.title });
  if (parsed.content) fields.push({ label: "content", text: parsed.content });

  return runModeratedFieldsAction(
    supabase,
    {
      userId: input.authorId,
      contentKind: "social_post",
      fields,
    },
    async (values) => {
      let index = 0;
      const caption = values[index++] ?? parsed.caption;
      const title = parsed.title ? values[index++] ?? null : null;
      const content = parsed.content ? values[index++] ?? null : null;

      try {
        await supabase
          .from("user_interests")
          .insert({ user_id: input.authorId, area_id: parsed.areaId });
      } catch {
        // Non-fatal if interest is already linked
      }

      const { data, error } = await supabase
        .from("social_posts")
        .insert({
          author_id: input.authorId,
          caption,
          media_url: parsed.mediaUrl || null,
          media_type: parsed.mediaType,
          is_reel: postType === "micro" ? true : parsed.isReel,
          area_id: parsed.areaId,
          target_audience: parsed.targetAudience ?? "all",
          target_grade: parsed.targetGrade ?? null,
          post_type: postType,
          title,
          content,
          quiz_id: parsed.quizId ?? null,
          premium_prep_label: parsed.premiumPrepLabel ?? null,
          premium_prep_url: parsed.premiumPrepUrl ?? null,
          sponsored_label: parsed.sponsoredLabel ?? null,
          sponsored_target_url: parsed.sponsoredTargetUrl ?? null,
          external_url: parsed.externalUrl ?? null,
          co_author_id: parsed.coAuthorId ?? null,
          location_name: parsed.locationName ?? null,
          city: parsed.city ?? null,
          district: parsed.district ?? null,
        } as Database["public"]["Tables"]["social_posts"]["Insert"])
        .select("*")
        .single();

      if (error) throw error;
      return data;
    },
  );
}

export async function updateSocialPost(
  supabase: SupabaseClient<Database>,
  input: {
    postId: string;
    authorId: string;
    caption?: string;
    title?: string | null;
    content?: string | null;
    areaId?: number;
    targetAudience?: "all" | "parent_only" | "grade";
    targetGrade?: string | null;
    externalUrl?: string | null;
    locationName?: string | null;
    city?: string | null;
    district?: string | null;
  },
) {
  const parsed = updateSocialPostSchema.parse(input);

  const { data: existing, error: fetchError } = await supabase
    .from("social_posts")
    .select("id, author_id")
    .eq("id", parsed.postId)
    .single();

  if (fetchError || !existing) {
    throw new Error("Gönderi bulunamadı.");
  }

  if (existing.author_id !== input.authorId) {
    throw new Error("Bu gönderiyi düzenleme yetkiniz yok.");
  }

  const fields: { label: string; text: string }[] = [];
  if (parsed.caption) fields.push({ label: "caption", text: parsed.caption });
  if (parsed.title) fields.push({ label: "title", text: parsed.title });
  if (parsed.content) fields.push({ label: "content", text: parsed.content });

  if (fields.length === 0) {
    const updatePayload: Record<string, unknown> = {};
    if (parsed.areaId !== undefined) updatePayload.area_id = parsed.areaId;
    if (parsed.targetAudience !== undefined) updatePayload.target_audience = parsed.targetAudience;
    if (parsed.targetGrade !== undefined) updatePayload.target_grade = parsed.targetGrade;
    if (parsed.externalUrl !== undefined) updatePayload.external_url = parsed.externalUrl;
    if (parsed.locationName !== undefined) updatePayload.location_name = parsed.locationName;
    if (parsed.city !== undefined) updatePayload.city = parsed.city;
    if (parsed.district !== undefined) updatePayload.district = parsed.district;

    if (Object.keys(updatePayload).length === 0) {
      throw new Error("Güncellenecek alan belirtilmedi.");
    }

    const { data, error } = await supabase
      .from("social_posts")
      .update(updatePayload as Database["public"]["Tables"]["social_posts"]["Update"])
      .eq("id", parsed.postId)
      .eq("author_id", input.authorId)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  return runModeratedFieldsAction(
    supabase,
    {
      userId: input.authorId,
      contentKind: "social_post",
      fields,
    },
    async (values) => {
      let index = 0;
      const updatePayload: Record<string, unknown> = {};

      if (parsed.caption) updatePayload.caption = values[index++] ?? parsed.caption;
      if (parsed.title) updatePayload.title = values[index++] ?? parsed.title;
      if (parsed.content) updatePayload.content = values[index++] ?? parsed.content;
      if (parsed.areaId !== undefined) updatePayload.area_id = parsed.areaId;
      if (parsed.targetAudience !== undefined) updatePayload.target_audience = parsed.targetAudience;
      if (parsed.targetGrade !== undefined) updatePayload.target_grade = parsed.targetGrade;
      if (parsed.externalUrl !== undefined) updatePayload.external_url = parsed.externalUrl;
      if (parsed.locationName !== undefined) updatePayload.location_name = parsed.locationName;
      if (parsed.city !== undefined) updatePayload.city = parsed.city;
      if (parsed.district !== undefined) updatePayload.district = parsed.district;

      const { data, error } = await supabase
        .from("social_posts")
        .update(updatePayload as Database["public"]["Tables"]["social_posts"]["Update"])
        .eq("id", parsed.postId)
        .eq("author_id", input.authorId)
        .select("*")
        .single();

      if (error) throw error;
      return data;
    },
  );
}

export async function createStory(
  supabase: SupabaseClient<Database>,
  input: { areaId: number; authorId: string; caption?: string; mediaUrl?: string },
) {
  const parsed = createStorySchema.parse(input);

  return runModeratedOptionalTextAction(
    supabase,
    {
      userId: input.authorId,
      contentKind: "story",
      text: parsed.caption,
    },
    async (safeCaption) => {
      const { data, error } = await supabase
        .from("stories")
        .insert({
          author_id: input.authorId,
          area_id: parsed.areaId,
          caption: safeCaption,
          media_url: parsed.mediaUrl || null,
        })
        .select("*")
        .single();

      if (error) throw error;
      return data;
    },
  );
}

export async function createStoryReply(
  supabase: SupabaseClient<Database>,
  input: { storyId: string; userId: string; userRole: UserRow["role"]; content: string },
) {
  const parsed = storyReplySchema.parse(input);

  return runModeratedPublishAction(
    supabase,
    {
      userId: input.userId,
      userRole: input.userRole,
      contentKind: "story_reply",
      text: parsed.content,
    },
    async ({ text: content, moderationStatus }) => {
      const { data, error } = await supabase
        .from("story_replies")
        .insert({
          story_id: parsed.storyId,
          user_id: input.userId,
          content,
          moderation_status: moderationStatus,
        })
        .select("*")
        .single();

      if (error) throw error;
      return data;
    },
  );
}

export async function completeReelWatch(
  supabase: SupabaseClient<Database>,
  input: { postId: string; secondsWatched: number; userId: string },
): Promise<LearningAwardResult> {
  const parsed = reelWatchCompletionSchema.parse(input);
  const { data: post, error: postError } = await supabase
    .from("social_posts")
    .select("id, is_reel, media_type")
    .eq("id", parsed.postId)
    .maybeSingle();

  if (postError) throw postError;
  if (!post || (!post.is_reel && post.media_type !== "video")) {
    throw new Error("Only verified reels or video lessons can award watch points.");
  }

  const { data, error } = await supabase.rpc("award_social_reel_watch_points", {
    p_target_user_id: input.userId,
    p_target_id: parsed.postId,
    p_points: 10,
  });

  if (error) throw error;
  const [result] = data ?? [];
  if (!result) {
    throw new Error("Learning points could not be awarded.");
  }

  return result;
}

export async function reportSocialPost(
  supabase: SupabaseClient<Database>,
  input: { postId: string; reporterId: string; reason?: string; details?: string },
) {
  const parsed = contentReportSchema.parse(input);
  const safeDetails = await assertModeratedOptionalTextAsync(parsed.details ?? null);
  const { data, error } = await supabase
    .from("content_reports")
    .upsert(
      {
        post_id: parsed.postId,
        reporter_id: input.reporterId,
        reason: parsed.reason,
        details: safeDetails,
        status: "open",
      },
      { onConflict: "post_id,reporter_id" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function getUserContentReports(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<UserContentReport[]> {
  const { data, error } = await supabase
    .from("content_reports")
    .select(
      `
      *,
      post:post_id (
        id,
        caption,
        media_type
      )
    `,
    )
    .eq("reporter_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return (data ?? []) as UserContentReport[];
}

export async function toggleLike(
  supabase: SupabaseClient<Database>,
  input: { postId: string; userId: string },
) {
  const parsed = socialPostActionSchema.parse(input);
  const liked = await hasRow(supabase, "post_likes", parsed.postId, input.userId);

  if (liked) {
    const { error } = await supabase
      .from("post_likes")
      .delete()
      .eq("post_id", parsed.postId)
      .eq("user_id", input.userId);
    if (error) throw error;
    return { is_liked: false, likes_count: await countPostLikes(supabase, parsed.postId) };
  }

  const { error } = await supabase.from("post_likes").insert({
    post_id: parsed.postId,
    user_id: input.userId,
  });
  if (error) throw error;
  await notifyPostAuthor(supabase, parsed.postId, input.userId, "like");
  return { is_liked: true, likes_count: await countPostLikes(supabase, parsed.postId) };
}

export async function toggleSave(
  supabase: SupabaseClient<Database>,
  input: { postId: string; userId: string },
) {
  const parsed = socialPostActionSchema.parse(input);
  const saved = await hasRow(supabase, "saved_posts", parsed.postId, input.userId);

  if (saved) {
    const { error } = await supabase
      .from("saved_posts")
      .delete()
      .eq("post_id", parsed.postId)
      .eq("user_id", input.userId);
    if (error) throw error;
    return { is_saved: false, saves_count: await countPostSaves(supabase, parsed.postId) };
  }

  const { error } = await supabase.from("saved_posts").insert({
    post_id: parsed.postId,
    user_id: input.userId,
  });
  if (error) throw error;
  return { is_saved: true, saves_count: await countPostSaves(supabase, parsed.postId) };
}

export async function createComment(
  supabase: SupabaseClient<Database>,
  input: { postId: string; userId: string; userRole: UserRow["role"]; content: string },
) {
  const parsed = commentSchema.parse(input);

  return runModeratedPublishAction(
    supabase,
    {
      userId: input.userId,
      userRole: input.userRole,
      contentKind: "comment",
      text: parsed.content,
    },
    async ({ text: content, moderationStatus }) => {
      const { data, error } = await supabase
        .from("post_comments")
        .insert({
          post_id: parsed.postId,
          user_id: input.userId,
          content,
          moderation_status: moderationStatus,
        })
        .select("*")
        .single();

      if (error) throw error;
      await notifyPostAuthor(supabase, parsed.postId, input.userId, "comment");
      return {
        ...data,
        comments_count: await countApprovedComments(supabase, parsed.postId),
      };
    },
  );
}

export async function toggleFollow(
  supabase: SupabaseClient<Database>,
  input: { followerId: string; followingId: string },
) {
  const parsed = followSchema.parse(input);
  if (input.followerId === parsed.followingId) {
    throw new Error("You cannot follow your own profile.");
  }

  const following = await hasFollow(supabase, input.followerId, parsed.followingId);

  if (following) {
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", input.followerId)
      .eq("following_id", parsed.followingId);
    if (error) throw error;
    return {
      followers_count: await countFollowers(supabase, parsed.followingId),
      following_count: await countFollowing(supabase, input.followerId),
      is_following: false,
    };
  }

  const { error } = await supabase.from("follows").insert({
    follower_id: input.followerId,
    following_id: parsed.followingId,
  });
  if (error) throw error;

  await supabase.from("notifications").insert({
    user_id: parsed.followingId,
    actor_id: input.followerId,
    kind: "follow",
    message: "started following you",
  });

  return {
    followers_count: await countFollowers(supabase, parsed.followingId),
    following_count: await countFollowing(supabase, input.followerId),
    is_following: true,
  };
}

export type FollowUserItem = {
  id: string;
  fullName: string;
  handle: string;
  avatarUrl: string | null;
  role: string;
  isVerified: boolean;
  bio: string | null;
  isFollowing: boolean;
};

export async function getUserFollowersList(
  supabase: SupabaseClient<Database>,
  targetUserId: string,
  viewerId?: string | null,
): Promise<FollowUserItem[]> {
  const { data: rows, error } = await supabase
    .from("follows")
    .select(`
      follower_id,
      follower:follower_id (
        id,
        full_name,
        avatar_url,
        role,
        is_verified,
        bio
      )
    `)
    .eq("following_id", targetUserId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  if (!rows || rows.length === 0) return [];

  let viewerFollowSet = new Set<string>();
  if (viewerId && rows.length > 0) {
    const followerIds = rows.map((r) => r.follower_id).filter((id): id is string => Boolean(id));
    if (followerIds.length > 0) {
      const { data: followings } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", viewerId)
        .in("following_id", followerIds);
      if (followings) {
        viewerFollowSet = new Set(followings.map((f) => f.following_id));
      }
    }
  }

  return rows
    .map((row) => {
      const u = row.follower as unknown as {
        id: string;
        full_name: string;
        avatar_url?: string | null;
        role: string;
        is_verified?: boolean;
        bio?: string | null;
      } | null;
      if (!u || !u.id || !u.full_name) return null;
      return {
        id: u.id,
        fullName: u.full_name,
        handle: u.full_name.toLowerCase().replaceAll(" ", ""),
        avatarUrl: u.avatar_url ?? null,
        role: u.role ?? "student",
        isVerified: Boolean(u.is_verified),
        bio: u.bio ?? null,
        isFollowing: viewerFollowSet.has(u.id),
      };
    })
    .filter((item): item is FollowUserItem => item !== null);
}

export async function getUserFollowingList(
  supabase: SupabaseClient<Database>,
  targetUserId: string,
  viewerId?: string | null,
): Promise<FollowUserItem[]> {
  const { data: rows, error } = await supabase
    .from("follows")
    .select(`
      following_id,
      following:following_id (
        id,
        full_name,
        avatar_url,
        role,
        is_verified,
        bio
      )
    `)
    .eq("follower_id", targetUserId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  if (!rows || rows.length === 0) return [];

  let viewerFollowSet = new Set<string>();
  if (viewerId && rows.length > 0) {
    const followingIds = rows.map((r) => r.following_id).filter((id): id is string => Boolean(id));
    if (followingIds.length > 0) {
      const { data: followings } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", viewerId)
        .in("following_id", followingIds);
      if (followings) {
        viewerFollowSet = new Set(followings.map((f) => f.following_id));
      }
    }
  }

  return rows
    .map((row) => {
      const u = row.following as unknown as {
        id: string;
        full_name: string;
        avatar_url?: string | null;
        role: string;
        is_verified?: boolean;
        bio?: string | null;
      } | null;
      if (!u || !u.id || !u.full_name) return null;
      return {
        id: u.id,
        fullName: u.full_name,
        handle: u.full_name.toLowerCase().replaceAll(" ", ""),
        avatarUrl: u.avatar_url ?? null,
        role: u.role ?? "student",
        isVerified: Boolean(u.is_verified),
        bio: u.bio ?? null,
        isFollowing: viewerFollowSet.has(u.id),
      };
    })
    .filter((item): item is FollowUserItem => item !== null);
}
