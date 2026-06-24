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
    mediaUrl?: string;
    mediaType?: SocialMediaType;
    isReel?: boolean;
    areaId: number;
    postType?: ContentPostType;
    title?: string;
    content?: string;
    quizId?: string;
    premiumPrepLabel?: string;
    premiumPrepUrl?: string;
    sponsoredLabel?: string;
    sponsoredTargetUrl?: string;
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

      const { data, error } = await supabase
        .from("social_posts")
        .insert({
          author_id: input.authorId,
          caption,
          media_url: parsed.mediaUrl || null,
          media_type: parsed.mediaType,
          is_reel: postType === "micro" ? true : parsed.isReel,
          area_id: parsed.areaId,
          post_type: postType,
          title,
          content,
          quiz_id: parsed.quizId ?? null,
          premium_prep_label: parsed.premiumPrepLabel ?? null,
          premium_prep_url: parsed.premiumPrepUrl ?? null,
          sponsored_label: parsed.sponsoredLabel ?? null,
          sponsored_target_url: parsed.sponsoredTargetUrl ?? null,
        })
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
