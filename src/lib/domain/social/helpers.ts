import type { SupabaseClient } from "@supabase/supabase-js";

import type { SocialFeedPost, SuggestedCreator } from "@/lib/domain/social/types";
import { isSponsoredAdActive, isSponsoredAdConfigured } from "@/lib/domain/sponsored-ads";
import type {
  Database,
  EducationAreaRow,
  SocialPostRow,
  UserRow,
} from "@/lib/supabase/database.types";

export type RawSocialPost = SocialPostRow & {
  author: Pick<UserRow, "id" | "full_name" | "role" | "is_verified"> | null;
  area: Pick<EducationAreaRow, "area_name"> | null;
};

export async function hydrateSocialPosts(
  supabase: SupabaseClient<Database>,
  posts: RawSocialPost[],
  viewerId?: string,
  canOpenPremiumPrep = false,
  canOpenSponsored = false,
): Promise<SocialFeedPost[]> {
  if (posts.length === 0) return [];

  const postIds = posts.map((post) => post.id);
  const [likesByPost, commentsByPost, savesByPost, likedPostIds, savedPostIds] = await Promise.all([
    batchCountRowsByPostId(supabase, "post_likes", postIds),
    batchCountApprovedCommentsByPostId(supabase, postIds),
    batchCountRowsByPostId(supabase, "saved_posts", postIds),
    viewerId ? batchViewerPostIds(supabase, "post_likes", postIds, viewerId) : Promise.resolve(new Set<string>()),
    viewerId ? batchViewerPostIds(supabase, "saved_posts", postIds, viewerId) : Promise.resolve(new Set<string>()),
  ]);

  return posts.map((post) => {
    const likes = likesByPost.get(post.id) ?? 0;
    const comments = commentsByPost.get(post.id) ?? 0;
    const saves = savesByPost.get(post.id) ?? 0;
    const hasPremiumPrep = Boolean(post.premium_prep_label && post.premium_prep_url);
    const hasSponsored = isSponsoredAdConfigured(post);
    const sponsoredActive = isSponsoredAdActive(post);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- strip hidden URLs before serializing feed posts
    const { premium_prep_url, sponsored_target_url, ...visiblePost } = post;

    return {
      ...visiblePost,
      premium_prep_label: post.premium_prep_label,
      sponsored_label: post.sponsored_label,
      sponsored_disclosure: post.sponsored_disclosure,
      has_premium_prep: hasPremiumPrep,
      has_sponsored: hasSponsored,
      is_sponsored_active: sponsoredActive,
      can_open_premium_prep: hasPremiumPrep && canOpenPremiumPrep,
      can_open_sponsored: sponsoredActive && canOpenSponsored,
      likes_count: likes,
      comments_count: comments,
      saves_count: saves,
      ranking_score: scoreSocialPost(post, likes, comments, saves),
      is_liked: likedPostIds.has(post.id),
      is_saved: savedPostIds.has(post.id),
    };
  });
}

async function batchCountRowsByPostId(
  supabase: SupabaseClient<Database>,
  table: "post_likes" | "saved_posts",
  postIds: string[],
) {
  const counts = new Map<string, number>();
  for (const postId of postIds) counts.set(postId, 0);
  if (postIds.length === 0) return counts;

  const { data, error } = await supabase.from(table).select("post_id").in("post_id", postIds);
  if (error) throw error;

  for (const row of data ?? []) {
    if (!row.post_id) continue;
    counts.set(row.post_id, (counts.get(row.post_id) ?? 0) + 1);
  }

  return counts;
}

async function batchCountApprovedCommentsByPostId(
  supabase: SupabaseClient<Database>,
  postIds: string[],
) {
  const counts = new Map<string, number>();
  for (const postId of postIds) counts.set(postId, 0);
  if (postIds.length === 0) return counts;

  const { data, error } = await supabase
    .from("post_comments")
    .select("post_id")
    .in("post_id", postIds)
    .eq("moderation_status", "approved");

  if (error) throw error;

  for (const row of data ?? []) {
    if (!row.post_id) continue;
    counts.set(row.post_id, (counts.get(row.post_id) ?? 0) + 1);
  }

  return counts;
}

async function batchViewerPostIds(
  supabase: SupabaseClient<Database>,
  table: "post_likes" | "saved_posts",
  postIds: string[],
  userId: string,
) {
  if (postIds.length === 0) return new Set<string>();

  const { data, error } = await supabase
    .from(table)
    .select("post_id")
    .in("post_id", postIds)
    .eq("user_id", userId);

  if (error) throw error;
  return new Set((data ?? []).map((row) => row.post_id).filter((postId): postId is string => Boolean(postId)));
}

export async function listAreaMatchedTeachers(
  supabase: SupabaseClient<Database>,
  viewerId: string | undefined,
  limit: number,
): Promise<SuggestedCreator[]> {
  const areaIds = viewerId ? await getUserSocialFeedAreaIds(supabase, viewerId) : [];

  if (viewerId && areaIds.length === 0) return [];

  let interestQuery = supabase.from("user_interests").select("user_id, area_id").limit(120);

  if (areaIds.length > 0) {
    interestQuery = interestQuery.in("area_id", areaIds);
  }

  const { data: interestRows, error: interestError } = await interestQuery;
  if (interestError) throw interestError;
  if (!interestRows?.length) return [];

  const uniqueAreaIds = [...new Set(interestRows.map((row) => row.area_id))];
  const { data: areas, error: areasError } = await supabase
    .from("education_areas")
    .select("id, area_name")
    .in("id", uniqueAreaIds);

  if (areasError) throw areasError;

  const areaNameById = new Map((areas ?? []).map((area) => [area.id, area.area_name]));
  const areaByTeacher = new Map<string, string>();
  for (const row of interestRows) {
    if (!row.user_id || areaByTeacher.has(row.user_id)) continue;
    areaByTeacher.set(row.user_id, areaNameById.get(row.area_id) ?? "Education");
  }

  const teacherIds = [...areaByTeacher.keys()].filter((id) => id !== viewerId);
  if (teacherIds.length === 0) return [];

  const { data: teachers, error: teachersError } = await supabase
    .from("users")
    .select("id, full_name, role, is_verified")
    .in("id", teacherIds)
    .eq("role", "teacher")
    .eq("is_verified", true)
    .limit(limit);

  if (teachersError) throw teachersError;

  const followingChecks = viewerId
    ? await Promise.all(
        (teachers ?? []).map((teacher) => hasFollow(supabase, viewerId, teacher.id)),
      )
    : (teachers ?? []).map(() => false);

  return (teachers ?? []).map((teacher, index) => ({
    id: teacher.id,
    full_name: teacher.full_name,
    area_name: areaByTeacher.get(teacher.id) ?? "Education",
    is_following: followingChecks[index] ?? false,
  }));
}

export async function countPostLikes(supabase: SupabaseClient<Database>, postId: string) {
  const { count, error } = await supabase
    .from("post_likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);

  if (error) throw error;
  return count ?? 0;
}

export async function getUserSocialFeedAreaIds(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from("user_interests")
    .select("area_id")
    .eq("user_id", userId);

  if (error) throw error;
  return (data ?? []).map((item) => item.area_id);
}

export async function countApprovedComments(supabase: SupabaseClient<Database>, postId: string) {
  const { count, error } = await supabase
    .from("post_comments")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId)
    .eq("moderation_status", "approved");

  if (error) throw error;
  return count ?? 0;
}

export async function countPostSaves(supabase: SupabaseClient<Database>, postId: string) {
  const { count, error } = await supabase
    .from("saved_posts")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);

  if (error) throw error;
  return count ?? 0;
}

export function rankSocialPosts(posts: SocialFeedPost[]) {
  return [...posts].sort((first, second) => second.ranking_score - first.ranking_score);
}

function scoreSocialPost(post: SocialPostRow, likes: number, comments: number, saves: number) {
  const ageHours = Math.max(1, (Date.now() - new Date(post.created_at).getTime()) / 36e5);
  const recency = 120 / Math.sqrt(ageHours);
  const formatBoost = post.is_reel || post.media_type === "video" ? 18 : 0;
  return recency + likes * 1.5 + comments * 4 + saves * 6 + formatBoost;
}

export async function countUserPosts(supabase: SupabaseClient<Database>, userId: string) {
  const { count, error } = await supabase
    .from("social_posts")
    .select("*", { count: "exact", head: true })
    .eq("author_id", userId);

  if (error) throw error;
  return count ?? 0;
}

export async function countFollowers(supabase: SupabaseClient<Database>, userId: string) {
  const { count, error } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", userId);

  if (error) throw error;
  return count ?? 0;
}

export async function countFollowing(supabase: SupabaseClient<Database>, userId: string) {
  const { count, error } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", userId);

  if (error) throw error;
  return count ?? 0;
}

export async function hasRow(
  supabase: SupabaseClient<Database>,
  table: "post_likes" | "saved_posts",
  postId: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from(table)
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function hasFollow(
  supabase: SupabaseClient<Database>,
  followerId: string,
  followingId: string,
) {
  const { data, error } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function notifyPostAuthor(
  supabase: SupabaseClient<Database>,
  postId: string,
  actorId: string,
  kind: "like" | "comment",
) {
  const { data: post, error } = await supabase
    .from("social_posts")
    .select("author_id")
    .eq("id", postId)
    .maybeSingle();

  if (error) throw error;
  if (!post || post.author_id === actorId) return;

  await supabase.from("notifications").insert({
    user_id: post.author_id,
    actor_id: actorId,
    kind,
    post_id: postId,
    message: kind === "like" ? "liked your post" : "commented on your post",
  });
}
