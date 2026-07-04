import type { SupabaseClient } from "@supabase/supabase-js";

import { resolvePremiumPrepAccess } from "@/lib/domain/premium-prep";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { decodeFeedCursor, encodeFeedCursor } from "@/lib/domain/social/feed-cursor";
import {
  countFollowers,
  countFollowing,
  countUserPosts,
  getUserSocialFeedAreaIds,
  hasFollow,
  hydrateSocialPosts,
  listAreaMatchedTeachers,
  rankSocialPosts,
  type RawSocialPost,
} from "@/lib/domain/social/helpers";
import { socialPostActionSchema } from "@/lib/domain/social/schemas";
import type {
  ActiveStory,
  CreatorSearchResult,
  ProfileSocialStats,
  SocialComment,
  SocialFeedPost,
  SocialNotification,
  SuggestedCreator,
} from "@/lib/domain/social/types";
import type { ContentPostType, Database, SocialPostRow } from "@/lib/supabase/database.types";

export type SocialFeedQuery = {
  limit?: number;
  cursor?: string;
  offset?: number;
  postTypes?: ContentPostType[];
};

export type SocialFeedPage = {
  posts: SocialFeedPost[];
  nextCursor: string | null;
};

async function resolveViewerCanOpenPremiumPrep(
  supabase: SupabaseClient<Database>,
  viewerId?: string,
) {
  if (!viewerId) return false;
  const profile = await getCurrentProfile(supabase);
  if (!profile) return false;
  const access = await resolvePremiumPrepAccess(supabase, viewerId, profile.role);
  return access.canOpen;
}

export async function getSocialFeed(
  supabase: SupabaseClient<Database>,
  viewerId?: string,
  query: SocialFeedQuery = {},
): Promise<SocialFeedPage> {
  const areaIds = viewerId ? await getUserSocialFeedAreaIds(supabase, viewerId) : [];
  if (viewerId && areaIds.length === 0) return { posts: [], nextCursor: null };

  const limit = Math.min(50, Math.max(1, query.limit ?? 30));
  const decodedCursor = decodeFeedCursor(query.cursor);

  let dbQuery = supabase
    .from("social_posts")
    .select(
      `
      *,
      author:author_id (
        id,
        full_name,
        role,
        is_verified
      ),
      area:area_id (
        area_name
      )
    `,
    )
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (decodedCursor) {
    dbQuery = dbQuery.or(
      `created_at.lt.${decodedCursor.createdAt},and(created_at.eq.${decodedCursor.createdAt},id.lt.${decodedCursor.id})`,
    );
    dbQuery = dbQuery.limit(limit);
  } else if (query.offset && query.offset > 0) {
    dbQuery = dbQuery.range(query.offset, query.offset + limit - 1);
  } else {
    dbQuery = dbQuery.limit(limit);
  }

  if (areaIds.length > 0) {
    dbQuery = dbQuery.in("area_id", areaIds);
  }

  if (query.postTypes && query.postTypes.length > 0) {
    dbQuery = dbQuery.in("post_type", query.postTypes);
  }

  const { data, error } = await dbQuery;

  if (error) throw error;

  const posts = (data ?? []) as RawSocialPost[];
  if (posts.length === 0) return { posts: [], nextCursor: null };

  const profile = viewerId ? await getCurrentProfile(supabase) : null;
  const premiumAccess = await resolvePremiumPrepAccess(supabase, viewerId, profile?.role ?? null);
  const canOpenSponsored = Boolean(viewerId);

  const lastRawPost = posts.length === limit ? posts[posts.length - 1] : null;
  const hydrated = await hydrateSocialPosts(
    supabase,
    posts,
    viewerId,
    premiumAccess.canOpen,
    canOpenSponsored,
  );

  return {
    posts: rankSocialPosts(hydrated),
    nextCursor: lastRawPost
      ? encodeFeedCursor({ createdAt: lastRawPost.created_at, id: lastRawPost.id })
      : null,
  };
}


export async function searchSocialPosts(
  supabase: SupabaseClient<Database>,
  query: string,
  viewerId?: string,
) {
  const trimmed = query.trim();
  if (!trimmed) {
    const page = await getSocialFeed(supabase, viewerId);
    return page.posts;
  }
  const areaIds = viewerId ? await getUserSocialFeedAreaIds(supabase, viewerId) : [];
  if (viewerId && areaIds.length === 0) return [];

  let searchQuery = supabase
    .from("social_posts")
    .select(
      `
      *,
      author:author_id (
        id,
        full_name,
        role,
        is_verified
      ),
      area:area_id (
        area_name
      )
    `,
    )
    .ilike("caption", `%${trimmed}%`)
    .order("created_at", { ascending: false })
    .limit(30);

  if (areaIds.length > 0) {
    searchQuery = searchQuery.in("area_id", areaIds);
  }

  const { data, error } = await searchQuery;

  if (error) throw error;
  const canOpenSponsored = Boolean(viewerId);
  const canOpenPremiumPrep = await resolveViewerCanOpenPremiumPrep(supabase, viewerId);
  const hydrated = await hydrateSocialPosts(
    supabase,
    (data ?? []) as RawSocialPost[],
    viewerId,
    canOpenPremiumPrep,
    canOpenSponsored,
  );
  return rankSocialPosts(hydrated);
}

export async function searchCreators(
  supabase: SupabaseClient<Database>,
  query: string,
): Promise<CreatorSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, role, is_verified")
    .ilike("full_name", `%${trimmed}%`)
    .limit(20);

  if (error) throw error;
  return data ?? [];
}

export async function getMatchedTeachers(
  supabase: SupabaseClient<Database>,
  viewerId?: string,
  limit = 20,
): Promise<SuggestedCreator[]> {
  return listAreaMatchedTeachers(supabase, viewerId, limit);
}

export async function getSuggestedCreators(
  supabase: SupabaseClient<Database>,
  viewerId?: string,
  limit = 6,
): Promise<SuggestedCreator[]> {
  const teachers = await listAreaMatchedTeachers(supabase, viewerId, limit * 2);
  return teachers.filter((teacher) => !teacher.is_following).slice(0, limit);
}

export async function getPublicProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, role, is_verified, total_points, avatar_assets, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function isFollowing(
  supabase: SupabaseClient<Database>,
  followerId: string,
  followingId: string,
) {
  return hasFollow(supabase, followerId, followingId);
}

export async function getSocialPostById(
  supabase: SupabaseClient<Database>,
  postId: string,
  viewerId?: string,
) {
  const parsed = socialPostActionSchema.parse({ postId });
  const { data, error } = await supabase
    .from("social_posts")
    .select(
      `
      *,
      author:author_id (
        id,
        full_name,
        role,
        is_verified
      ),
      area:area_id (
        area_name
      )
    `,
    )
    .eq("id", parsed.postId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const profile = viewerId ? await getCurrentProfile(supabase) : null;
  const premiumAccess = await resolvePremiumPrepAccess(supabase, viewerId, profile?.role ?? null);
  const [post] = await hydrateSocialPosts(
    supabase,
    [data as RawSocialPost],
    viewerId,
    premiumAccess.canOpen,
    Boolean(viewerId),
  );
  return post;
}

export async function getReelFeed(
  supabase: SupabaseClient<Database>,
  viewerId?: string,
): Promise<SocialFeedPost[]> {
  const page = await getSocialFeed(supabase, viewerId);
  return page.posts.filter((post) => post.is_reel || post.media_type === "video");
}

export async function getFollowingFeed(
  supabase: SupabaseClient<Database>,
  viewerId: string,
): Promise<SocialFeedPost[]> {
  const { data: follows, error: followsError } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", viewerId);

  if (followsError) throw followsError;

  const followingIds = follows.map((follow) => follow.following_id);
  if (followingIds.length === 0) return [];

  const { data, error } = await supabase
    .from("social_posts")
    .select(
      `
      *,
      author:author_id (
        id,
        full_name,
        role,
        is_verified
      ),
      area:area_id (
        area_name
      )
    `,
    )
    .in("author_id", followingIds)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) throw error;
  const canOpenSponsored = Boolean(viewerId);
  const canOpenPremiumPrep = await resolveViewerCanOpenPremiumPrep(supabase, viewerId);
  const hydrated = await hydrateSocialPosts(
    supabase,
    (data ?? []) as RawSocialPost[],
    viewerId,
    canOpenPremiumPrep,
    canOpenSponsored,
  );
  return rankSocialPosts(hydrated);
}

export async function getUserSocialPosts(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<SocialPostRow[]> {
  const { data, error } = await supabase
    .from("social_posts")
    .select("*")
    .eq("author_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) throw error;
  return data ?? [];
}

export async function getUserSocialReels(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<SocialPostRow[]> {
  const { data, error } = await supabase
    .from("social_posts")
    .select("*")
    .eq("author_id", userId)
    .or("is_reel.eq.true,media_type.eq.video")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) throw error;
  return data ?? [];
}

export async function getSavedSocialPosts(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<SocialPostRow[]> {
  const { data, error } = await supabase
    .from("saved_posts")
    .select(
      `
      post:social_posts (
        id,
        author_id,
        area_id,
        caption,
        media_url,
        media_type,
        is_reel,
        created_at
      )
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) throw error;

  return (data ?? [])
    .map((item) => item.post)
    .filter((post): post is SocialPostRow => Boolean(post));
}

export async function getActiveStories(supabase: SupabaseClient<Database>): Promise<ActiveStory[]> {
  const { data, error } = await supabase
    .from("stories")
    .select(
      `
      id,
      area_id,
      media_url,
      caption,
      created_at,
      author:author_id (
        id,
        full_name,
        role,
        is_verified
      )
    `,
    )
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return (data ?? []) as ActiveStory[];
}

export async function getNotifications(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<SocialNotification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select(
      `
      id,
      kind,
      message,
      post_id,
      lesson_request_id,
      is_read,
      created_at,
      actor:actor_id!notifications_actor_id_fkey (
        id,
        full_name,
        role,
        is_verified
      )
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) throw error;
  return (data ?? []) as SocialNotification[];
}

export async function getUnreadNotificationCount(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) throw error;
  return count ?? 0;
}

export async function markNotificationsRead(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) throw error;
}

export async function getProfileSocialStats(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<ProfileSocialStats> {
  const [posts, followers, following] = await Promise.all([
    countUserPosts(supabase, userId),
    countFollowers(supabase, userId),
    countFollowing(supabase, userId),
  ]);

  return { posts, followers, following };
}

export async function getPostComments(
  supabase: SupabaseClient<Database>,
  postId: string,
): Promise<SocialComment[]> {
  const parsed = socialPostActionSchema.parse({ postId });
  const { data, error } = await supabase
    .from("post_comments")
    .select(
      `
      id,
      content,
      moderation_status,
      created_at,
      author:user_id (
        id,
        full_name,
        role,
        is_verified
      )
    `,
    )
    .eq("post_id", parsed.postId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data ?? []) as SocialComment[];
}
