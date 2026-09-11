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
  countPostShares,
  hasFollow,
  hasFollowRequest,
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
    targetAudience?: "all" | "parent_only" | "grade" | "followers";
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
          followers_only: parsed.followersOnly,
          followers_only_comments: parsed.followersOnlyComments,
          teaser_text: parsed.teaserText ?? null,
        } as Database["public"]["Tables"]["social_posts"]["Insert"])
        .select("*")
        .single();

      if (error) throw error;

      if (data && (parsed.targetGrade || parsed.areaId)) {
        try {
          const { data: targetUsers } = await supabase
            .from("users")
            .select("id")
            .neq("id", input.authorId)
            .eq("grade_level", parsed.targetGrade ?? "")
            .limit(100);

          if (targetUsers && targetUsers.length > 0) {
            const notifs = targetUsers.map((u) => ({
              user_id: u.id,
              actor_id: input.authorId,
              kind: "post",
              message: `${parsed.targetGrade ? `${parsed.targetGrade} sınıfınız` : "Sınıfınız"} için yeni bir içerik paylaşıldı!`,
            }));
            await supabase.from("notifications").insert(notifs as unknown as Database["public"]["Tables"]["notifications"]["Insert"][]);
          }
        } catch {
          // Non-fatal notification error fallback
        }
      }

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
      const { error } = await supabase
        .from("stories")
        .insert({
          author_id: input.authorId,
          area_id: parsed.areaId,
          caption: safeCaption,
          media_url: parsed.mediaUrl || null,
          // @ts-expect-error - followers_only field exists in DB but missing from types
          followers_only: parsed.followersOnly,
        });

      if (error) throw error;

      // Do not SELECT after INSERT — the stories SELECT RLS policy may block
      // reading back the newly created row even for the author in some edge cases.
      // The caller only needs confirmation that creation succeeded.
      return { author_id: input.authorId, area_id: parsed.areaId, caption: safeCaption };
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

  // Check followers_only_comments restriction
  const { data: postData } = await supabase
    .from("social_posts")
    .select("author_id, followers_only_comments")
    .eq("id", parsed.postId)
    .single();

  const pd = postData as { author_id: string; followers_only_comments: boolean | null } | null;
  if (pd?.followers_only_comments && pd.author_id !== input.userId) {
    const isFollowing = await hasFollow(supabase, input.userId, pd.author_id);
    if (!isFollowing) {
      throw new Error("Bu gönderiye sadece yazarın takipçileri yorum yapabilir.");
    }
  }

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
  input: { followerId: string; followingId: string; sourcePostId?: string | null },
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
      is_requested: false,
    };
  }

  // Check if target account is private
  const { data: targetUser } = await supabase
    .from("users")
    .select("is_private" as unknown as "id")
    .eq("id", parsed.followingId)
    .maybeSingle();

  const isTargetPrivate = Boolean(
    (targetUser as unknown as { is_private?: boolean } | null)?.is_private
  );

  if (isTargetPrivate) {
    // Check if there is already a pending request
    const existingReq = await hasFollowRequest(supabase, input.followerId, parsed.followingId);
    const requestsTable = (supabase as unknown as {
      from: (table: string) => {
        delete: () => {
          eq: (col1: string, val1: string) => {
            eq: (col2: string, val2: string) => Promise<{ error: unknown }>;
          };
        };
        insert: (row: Record<string, unknown>) => Promise<{ error: unknown }>;
      };
    }).from("follow_requests");

    if (existingReq) {
      // Cancel follow request
      await requestsTable
        .delete()
        .eq("requester_id", input.followerId)
        .eq("target_id", parsed.followingId);

      // Also clean up pending notification if present
      await supabase
        .from("notifications")
        .delete()
        .eq("user_id", parsed.followingId)
        .eq("actor_id", input.followerId)
        .eq("kind", "follow_request");

      return {
        followers_count: await countFollowers(supabase, parsed.followingId),
        following_count: await countFollowing(supabase, input.followerId),
        is_following: false,
        is_requested: false,
      };
    }

    // Create pending follow request
    const { error: reqError } = await requestsTable.insert({
      requester_id: input.followerId,
      target_id: parsed.followingId,
      status: "pending",
    });

    if (reqError) throw reqError;

    // Send notification and push
    await supabase.from("notifications").insert({
      user_id: parsed.followingId,
      actor_id: input.followerId,
      kind: "follow_request",
      message: "sana takip isteği gönderdi",
    });

    try {
      const { sendSocialNotification } = await import("@/lib/server/onesignal");
      await sendSocialNotification(supabase, parsed.followingId, input.followerId, "follow_request");
    } catch (err) {
      console.error("[ONESIGNAL_PUSH_ERROR]", err);
    }

    return {
      followers_count: await countFollowers(supabase, parsed.followingId),
      following_count: await countFollowing(supabase, input.followerId),
      is_following: false,
      is_requested: true,
    };
  }

  const { error } = await supabase.from("follows").insert({
    follower_id: input.followerId,
    following_id: parsed.followingId,
  });
  if (error) throw error;

  if (parsed.sourcePostId) {
    try {
      const { error: _error } = await supabase.rpc("increment_follower_conversion", {
      p_post_id: parsed.sourcePostId,
    });
      void _error;
    } catch {
      // Best effort analytic
    }
  }

  await supabase.from("notifications").insert({
    user_id: parsed.followingId,
    actor_id: input.followerId,
    kind: "follow",
    message: "started following you",
  });

  try {
    const { sendSocialNotification } = await import("@/lib/server/onesignal");
    await sendSocialNotification(supabase, parsed.followingId, input.followerId, "follow");
  } catch (err) {
    console.error("[ONESIGNAL_PUSH_ERROR]", err);
  }

  return {
    followers_count: await countFollowers(supabase, parsed.followingId),
    following_count: await countFollowing(supabase, input.followerId),
    is_following: true,
    is_requested: false,
  };
}

export async function acceptFollowRequest(
  supabase: SupabaseClient<Database>,
  input: { targetUserId: string; requesterId: string },
) {
  // targetUserId is the current user receiving the request
  // requesterId is the user who asked to follow
  const requestsTable = (supabase as unknown as {
    from: (table: string) => {
      delete: () => {
        eq: (col1: string, val1: string) => {
          eq: (col2: string, val2: string) => Promise<{ error: unknown }>;
        };
      };
    };
  }).from("follow_requests");

  await requestsTable
    .delete()
    .eq("requester_id", input.requesterId)
    .eq("target_id", input.targetUserId);

  // Add to follows
  const { error: followError } = await supabase.from("follows").insert({
    follower_id: input.requesterId,
    following_id: input.targetUserId,
  });

  if (followError && !followError.message?.includes("duplicate")) {
    throw followError;
  }

  // Notify requester that request was accepted
  await supabase.from("notifications").insert({
    user_id: input.requesterId,
    actor_id: input.targetUserId,
    kind: "follow_accept",
    message: "takip isteğini kabul etti",
  });

  // Mark the original follow_request notification as read
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", input.targetUserId)
    .eq("actor_id", input.requesterId)
    .eq("kind", "follow_request");

  try {
    const { sendSocialNotification } = await import("@/lib/server/onesignal");
    await sendSocialNotification(supabase, input.requesterId, input.targetUserId, "follow_accept");
  } catch (err) {
    console.error("[ONESIGNAL_PUSH_ERROR]", err);
  }

  return { success: true };
}

export async function rejectFollowRequest(
  supabase: SupabaseClient<Database>,
  input: { targetUserId: string; requesterId: string },
) {
  const requestsTable = (supabase as unknown as {
    from: (table: string) => {
      delete: () => {
        eq: (col1: string, val1: string) => {
          eq: (col2: string, val2: string) => Promise<{ error: unknown }>;
        };
      };
    };
  }).from("follow_requests");

  await requestsTable
    .delete()
    .eq("requester_id", input.requesterId)
    .eq("target_id", input.targetUserId);

  // Mark the follow_request notification as read or delete
  await supabase
    .from("notifications")
    .delete()
    .eq("user_id", input.targetUserId)
    .eq("actor_id", input.requesterId)
    .eq("kind", "follow_request");

  return { success: true };
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

export async function deleteSocialPost(
  supabase: SupabaseClient<Database>,
  postId: string,
  authorId: string,
) {
  const { data: existing, error: fetchError } = await supabase
    .from("social_posts")
    .select("id, author_id")
    .eq("id", postId)
    .single();

  if (fetchError || !existing) {
    throw new Error("Gönderi bulunamadı.");
  }

  if (existing.author_id !== authorId) {
    throw new Error("Bu gönderiyi silme yetkiniz yok.");
  }

  const { error: deleteError } = await supabase
    .from("social_posts")
    .delete()
    .eq("id", postId);

  if (deleteError) {
    throw new Error("Gönderi silinemedi.");
  }

  return { success: true };
}

export async function sharePost(
  supabase: SupabaseClient<Database>,
  input: { postId: string; userId: string },
) {
  const parsed = socialPostActionSchema.parse(input);

  const { error } = await supabase
    .from("post_shares")
    .upsert(
      {
        post_id: parsed.postId,
        user_id: input.userId,
      },
      { onConflict: "post_id,user_id", ignoreDuplicates: true },
    );
  if (error) throw error;

  return { shares_count: await countPostShares(supabase, parsed.postId) };
}
