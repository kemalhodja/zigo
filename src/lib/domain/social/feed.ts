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
  const limit = Math.min(50, Math.max(1, query.limit ?? 30));
  const decodedCursor = decodeFeedCursor(query.cursor);

  const buildQuery = (filterByAreas: boolean) => {
    let dbQuery = supabase
      .from("social_posts")
      .select(
        `
        *,
        author:users!author_id (
          id,
          full_name,
          role,
          is_verified,
          organization_type,
          avatar_url
        ),
        co_author:users!co_author_id (
          id,
          full_name
        ),
        area:area_id (
          area_name
        )
      `
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

    if (filterByAreas && areaIds.length > 0) {
      dbQuery = dbQuery.in("area_id", areaIds);
    }

    if (query.postTypes && query.postTypes.length > 0) {
      dbQuery = dbQuery.in("post_type", query.postTypes);
    }

    return dbQuery;
  };

  const firstResult = await buildQuery(areaIds.length > 0);
  if (firstResult.error) throw firstResult.error;
  let data = firstResult.data;

  // Fallback to general feed if filtered feed returns empty
  if ((!data || data.length === 0) && areaIds.length > 0) {
    const fallbackResult = await buildQuery(false);
    if (!fallbackResult.error && fallbackResult.data) {
      data = fallbackResult.data;
    }
  }

  const posts = (data ?? []) as unknown as RawSocialPost[];
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


export async function getExplorePosts(
  supabase: SupabaseClient<Database>,
  viewerId?: string,
  query = "",
  limit = 30,
): Promise<SocialFeedPost[]> {
  const trimmed = query.trim();
  const safeLimit = Math.min(50, Math.max(1, limit));

  const { data, error } = await supabase.rpc("list_explore_social_posts", {
    p_limit: safeLimit,
    p_query: trimmed || undefined,
  });

  if (error) {
    const isMissingRpc =
      error.code === "PGRST202" ||
      error.code === "42883" ||
      /list_explore_social_posts/i.test(error.message ?? "");

    if (isMissingRpc) {
      const page = await getSocialFeed(supabase, viewerId, { limit: safeLimit });
      if (page.posts.length > 0) return page.posts;
      const globalPage = await getSocialFeed(supabase, undefined, { limit: safeLimit });
      return globalPage.posts;
    }

    throw error;
  }

  const posts = (Array.isArray(data) ? data : []) as RawSocialPost[];
  if (posts.length === 0) return [];

  const canOpenSponsored = Boolean(viewerId);
  const canOpenPremiumPrep = await resolveViewerCanOpenPremiumPrep(supabase, viewerId);
  const hydrated = await hydrateSocialPosts(
    supabase,
    posts,
    viewerId,
    canOpenPremiumPrep,
    canOpenSponsored,
  );
  return rankSocialPosts(hydrated);
}

export async function searchSocialPosts(
  supabase: SupabaseClient<Database>,
  query: string,
  viewerId?: string,
) {
  return getExplorePosts(supabase, viewerId, query);
}

export async function searchCreators(
  supabase: SupabaseClient<Database>,
  query: string,
): Promise<CreatorSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, role, is_verified, avatar_url")
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
    .select("id, full_name, bio, avatar_url, role, is_verified, total_points, avatar_assets, created_at, organization_type, website_url")
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
  const parsed = socialPostActionSchema.safeParse({ postId });
  if (!parsed.success) return null;
  
  const { data, error } = await supabase
    .from("social_posts")
    .select(
      `
      *,
      author:users!author_id (
        id,
        full_name,
        role,
        is_verified,
        organization_type,
        avatar_url
      ),
      area:area_id (
        area_name
      )
    `,
    )
    .eq("id", parsed.data.postId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const profile = viewerId ? await getCurrentProfile(supabase) : null;
  const premiumAccess = await resolvePremiumPrepAccess(supabase, viewerId, profile?.role ?? null);
  const [post] = await hydrateSocialPosts(
    supabase,
    [data as unknown as RawSocialPost],
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

  const followingIds = (follows ?? []).map((follow) => follow.following_id);
  const authorIds = [...new Set(followingIds)];

  if (authorIds.length === 0) return [];

  const { data, error } = await supabase
    .from("social_posts")
    .select(
      `
      *,
      author:users!author_id (
        id,
        full_name,
        role,
        is_verified,
        organization_type,
        avatar_url
      ),
      co_author:users!co_author_id (
        id,
        full_name
      ),
      area:area_id (
        area_name
      )
    `,
    )
    .in("author_id", authorIds)
    .neq("author_id", viewerId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  const canOpenSponsored = Boolean(viewerId);
  const canOpenPremiumPrep = await resolveViewerCanOpenPremiumPrep(supabase, viewerId);
  const hydrated = await hydrateSocialPosts(
    supabase,
    (data ?? []) as unknown as RawSocialPost[],
    viewerId,
    canOpenPremiumPrep,
    canOpenSponsored,
  );
  return rankSocialPosts(hydrated);
}

export async function getUserSocialPosts(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<SocialFeedPost[]> {
  const { data, error } = await supabase
    .from("social_posts")
    .select("*")
    .eq("author_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    // Fallback: if the aggregation isn't available, return without counts
    const { data: plain, error: plainErr } = await supabase
      .from("social_posts")
      .select("*")
      .eq("author_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);
    if (plainErr) throw plainErr;
    return (plain ?? []).map((p) => ({
      ...p,
      author: null,
      area: null,
      likes_count: 0,
      comments_count: 0,
      saves_count: 0,
      shares_count: 0,
      ranking_score: 0,
      is_liked: false,
      is_saved: false,
      has_premium_prep: Boolean(p.premium_prep_label),
      has_sponsored: Boolean(p.sponsored_label),
      is_sponsored_active: p.sponsored_status === "active",
      can_open_premium_prep: false,
      can_open_sponsored: false,
    })) as SocialFeedPost[];
  }

  return (data ?? []).map((p) => {
    return {
      ...p,
      author: null,
      area: null,
      likes_count: (p as { likes_count?: number }).likes_count ?? 0,
      comments_count: (p as { comments_count?: number }).comments_count ?? 0,
      saves_count: 0,
      shares_count: (p as { shares_count?: number }).shares_count ?? 0,
      ranking_score: 0,
      is_liked: false,
      is_saved: false,
      has_premium_prep: Boolean(p.premium_prep_label),
      has_sponsored: Boolean(p.sponsored_label),
      is_sponsored_active: p.sponsored_status === "active",
      can_open_premium_prep: false,
      can_open_sponsored: false,
    } as SocialFeedPost;
  });
}

export async function getUserSocialReels(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<SocialFeedPost[]> {
  const { data, error } = await supabase
    .from("social_posts")
    .select("*")
    .eq("author_id", userId)
    .or("is_reel.eq.true,media_type.eq.video")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    const { data: plain, error: plainErr } = await supabase
      .from("social_posts")
      .select("*")
      .eq("author_id", userId)
      .or("is_reel.eq.true,media_type.eq.video")
      .order("created_at", { ascending: false })
      .limit(30);
    if (plainErr) throw plainErr;
    return (plain ?? []).map((p) => ({
      ...p,
      author: null,
      area: null,
      likes_count: 0,
      comments_count: 0,
      saves_count: 0,
      shares_count: 0,
      ranking_score: 0,
      is_liked: false,
      is_saved: false,
      has_premium_prep: Boolean(p.premium_prep_label),
      has_sponsored: Boolean(p.sponsored_label),
      is_sponsored_active: p.sponsored_status === "active",
      can_open_premium_prep: false,
      can_open_sponsored: false,
    })) as SocialFeedPost[];
  }

  return (data ?? []).map((p) => {
    return {
      ...p,
      author: null,
      area: null,
      likes_count: (p as { likes_count?: number }).likes_count ?? 0,
      comments_count: (p as { comments_count?: number }).comments_count ?? 0,
      saves_count: 0,
      shares_count: (p as { shares_count?: number }).shares_count ?? 0,
      ranking_score: 0,
      is_liked: false,
      is_saved: false,
      has_premium_prep: Boolean(p.premium_prep_label),
      has_sponsored: Boolean(p.sponsored_label),
      is_sponsored_active: p.sponsored_status === "active",
      can_open_premium_prep: false,
      can_open_sponsored: false,
    } as SocialFeedPost;
  });
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
        is_verified,
        organization_type,
        avatar_url
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
      actor:users!notifications_actor_id_fkey (
        id,
        full_name,
        role,
        is_verified,
        avatar_url
      )
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    // Fallback without embed if relationship metadata is unavailable on older schemas.
    const basic = await supabase
      .from("notifications")
      .select("id, kind, message, post_id, lesson_request_id, is_read, created_at, actor_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (basic.error) throw basic.error;
    return (basic.data ?? []).map((row) => ({
      ...row,
      actor: null,
    })) as SocialNotification[];
  }

  return (data ?? []) as unknown as SocialNotification[];
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
        is_verified,
        avatar_url
      )
    `,
    )
    .eq("post_id", parsed.postId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data ?? []) as SocialComment[];
}
