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
  author: Pick<UserRow, "id" | "full_name" | "role" | "is_verified" | "organization_type" | "avatar_url"> | null;
  co_author?: Pick<UserRow, "id" | "full_name"> | null;
  area: Pick<EducationAreaRow, "area_name"> | null;
};

export function filterPostsForAudience(
  posts: RawSocialPost[],
  viewerId?: string,
  viewerProfile?: { id?: string; role?: string | null; grade_level?: string | null } | null,
): RawSocialPost[] {
  return posts.filter((post) => {
    // ── Öğrenci ve Veli gönderileri artık Keşfete düşebilir. No role-based exclusion.

    if (!post.target_audience || post.target_audience === "all") return true;
    if (
      post.author &&
      "organization_type" in post.author &&
      post.author.organization_type &&
      ["egitim_platformu", "egitim_kurumu", "okul", "kurs", "yayinevi"].includes(String(post.author.organization_type))
    ) {
      return true;
    }
    if (viewerId && post.author_id === viewerId) return true;
    if (post.target_audience === "parent_only") {
      return viewerProfile?.role === "parent";
    }
    if (post.target_audience === "grade") {
      if (!post.target_grade) return true;
      if (viewerProfile?.role === "parent" || viewerProfile?.role === "teacher" || viewerProfile?.role === "admin") {
        return true;
      }
      if (viewerProfile?.role === "student") {
        if (
          post.target_grade.includes("Hepsi") ||
          post.target_grade.includes("Tüm") ||
          post.target_grade === "Hepsi (Tüm Sınıflar)"
        ) {
          return true;
        }
        return viewerProfile.grade_level === post.target_grade;
      }
      return false;
    }
    return true;
  });
}

export async function hydrateSocialPosts(
  supabase: SupabaseClient<Database>,
  posts: RawSocialPost[],
  viewerId?: string,
  canOpenPremiumPrep = false,
  canOpenSponsored = false,
): Promise<SocialFeedPost[]> {
  if (posts.length === 0) return [];

  let allowedPosts = posts;
  let viewerContext: { role?: string | null; city?: string | null; district?: string | null } | null = null;
  if (viewerId) {
    const rawProfile = await supabase
      .from("users")
      .select("id, role, grade_level, city, district")
      .eq("id", viewerId)
      .maybeSingle()
      .then((r) => r.data as unknown);

    const profile = rawProfile as { id: string; role: string; grade_level?: string | null; city?: string | null; district?: string | null } | null;

    if (profile) {
      viewerContext = { role: profile.role, city: profile.city, district: profile.district };
      if (posts.some((p) => p.target_audience && p.target_audience !== "all")) {
        allowedPosts = filterPostsForAudience(posts, viewerId, profile as never);
      }
    }
  }

  if (allowedPosts.length === 0) return [];

  const postIds = allowedPosts.map((post) => post.id);
  const [likesByPost, commentsByPost, savesByPost, likedPostIds, savedPostIds] = await Promise.all([
    batchCountRowsByPostId(supabase, "post_likes", postIds),
    batchCountApprovedCommentsByPostId(supabase, postIds),
    batchCountRowsByPostId(supabase, "saved_posts", postIds),
    viewerId ? batchViewerPostIds(supabase, "post_likes", postIds, viewerId) : Promise.resolve(new Set<string>()),
    viewerId ? batchViewerPostIds(supabase, "saved_posts", postIds, viewerId) : Promise.resolve(new Set<string>()),
  ]);

  return allowedPosts.map((post) => {
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
      co_author: post.co_author,
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
      ranking_score: scoreSocialPost(post, likes, comments, saves, viewerContext),
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

  // Single query to fetch all rows, then count in memory — far faster than N individual COUNT queries
  const { data, error } = await supabase
    .from(table)
    .select("post_id")
    .in("post_id", postIds);

  if (!error && data) {
    for (const row of data) {
      if (row.post_id) {
        counts.set(row.post_id, (counts.get(row.post_id) ?? 0) + 1);
      }
    }
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

  // Single query for all comments — count in memory instead of N separate COUNT calls
  const { data, error } = await supabase
    .from("post_comments")
    .select("post_id")
    .in("post_id", postIds)
    .eq("moderation_status", "approved");

  if (!error && data) {
    for (const row of data) {
      if (row.post_id) {
        counts.set(row.post_id, (counts.get(row.post_id) ?? 0) + 1);
      }
    }
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
    .select("id, full_name, role, is_verified, avatar_url")
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
    avatar_url: teacher.avatar_url ?? null,
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

  if (error) return [];
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

function scoreSocialPost(
  post: SocialPostRow,
  likes: number,
  comments: number,
  saves: number,
  viewerContext?: {
    role?: string | null;
    city?: string | null;
    district?: string | null;
    userInterestAreas?: number[];
  } | null,
) {
  const ageHours = Math.max(1, (Date.now() - new Date(post.created_at).getTime()) / 36e5);
  const recency = 120 / Math.sqrt(ageHours);
  const formatBoost = post.is_reel || post.media_type === "video" ? 18 : 0;

  let sponsoredBoost = 0;
  let locationBoost = 0;
  const audienceBoost = 0;
  const interestBoost = 0;

  // Active approved sponsored ad scoring (Temporarily disabled)
  if (post.sponsored_status === "active") {
    sponsoredBoost = 0; // Temporarily disabled (was 150)
  } else if (viewerContext?.city) {
    // Regular organic post location boost
    const pLoc = post as SocialPostRow & { city?: string | null; district?: string | null };
    const postCity = pLoc.city ? pLoc.city.trim().toLowerCase() : null;
    const userCity = viewerContext.city ? viewerContext.city.trim().toLowerCase() : null;
    if (postCity && userCity && postCity === userCity) locationBoost += 30;
  }

  return recency + likes * 1.5 + comments * 4 + saves * 6 + formatBoost + sponsoredBoost + locationBoost + audienceBoost + interestBoost;
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

  const msg = kind === "like" ? "gönderini beğendi" : "gönderine yorum yaptı";

  await supabase.from("notifications").insert({
    user_id: post.author_id,
    actor_id: actorId,
    kind,
    post_id: postId,
    message: msg,
  });

  try {
    const { sendSocialNotification } = await import("@/lib/server/onesignal");
    await sendSocialNotification(supabase, post.author_id, actorId, kind, postId);
  } catch (err) {
    console.error("[ONESIGNAL_PUSH_ERROR]", err);
  }
}

