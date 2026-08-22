import type { SocialMediaSceneName } from "@/components/social-media-scenes";
import { displayEducationAreaName } from "@/lib/domain/education-catalog";

/* ─── Shared display types ─── */

export type DisplayStory = {
  id: string;
  creatorId: string | null;
  name: string;
  handle: string;
  accent: string;
  mediaUrl: string | null;
  progress: number;
  href: string;
  status: "create" | "unread" | "watched";
  storyKind?: "daily-mission" | "regular";
  showLiveBadge?: boolean;
  showNewBadge?: boolean;
  missionMeta?: string;
};

export type DisplayPost = {
  postId?: string;
  authorId?: string;
  authorName: string;
  coAuthorId?: string;
  coAuthorName?: string;
  handle: string;
  verified: boolean;
  caption: string;
  gradient: string;
  likes: number;
  comments: number;
  badge: string;
  area: string;
  mediaUrl: string | null;
  mediaType: string;
  scene?: SocialMediaSceneName;
  isLiked: boolean;
  isSaved: boolean;
  isFollowingCreator: boolean;
  canFollowCreator: boolean;
  createdAt?: string;
  premiumPrepLabel?: string;
  showPremiumPrep?: boolean;
  canOpenPremiumPrep?: boolean;
  sponsoredLabel?: string;
  sponsoredDisclosure?: string | null;
  showSponsored?: boolean;
  canOpenSponsored?: boolean;
  isSponsoredActive?: boolean;
  avatarUrl?: string | null;
  areaId?: number;
  isOwner?: boolean;
  locationName?: string | null;
  city?: string | null;
  district?: string | null;
};

export type DisplaySuggestedCreator = {
  id?: string;
  name: string;
  handle: string;
  area: string;
  href: string;
  isFollowing: boolean;
};

export type ReelSpotlightItem = {
  title: string;
  creator: string;
  gradient: string;
  scene: SocialMediaSceneName;
  mediaUrl?: string | null;
  mediaType?: string;
  href: string;
};

export type HomeTeacherInsights = {
  inboxCount: number;
  postCount: number;
} | null;

/* ─── Demo data ─── */

export const demoStories: DisplayStory[] = [
  {
    id: "your-story",
    creatorId: null,
    name: "Your Spark",
    handle: "you",
    accent: "from-crystal to-fuchsia-500",
    mediaUrl: null,
    href: "/create?mode=story",
    progress: 0,
    status: "create",
  },
  {
    id: "aylin",
    creatorId: null,
    name: "Aylin",
    handle: "aylinmath",
    accent: "from-amber-400 to-orange-500",
    mediaUrl: null,
    href: "/sparks",
    progress: 18,
    status: "unread",
  },
  {
    id: "mert",
    creatorId: null,
    name: "Mert",
    handle: "mertlab",
    accent: "from-emerald-500 to-teal-500",
    mediaUrl: null,
    href: "/sparks",
    progress: 42,
    status: "unread",
  },
  {
    id: "zigo",
    creatorId: null,
    name: "Zigo",
    handle: "zigodaily",
    accent: "from-sky-400 to-indigo-500",
    mediaUrl: null,
    href: "/sparks",
    progress: 76,
    status: "watched",
  },
  {
    id: "coding",
    creatorId: null,
    name: "Coding",
    handle: "codeclub",
    accent: "from-pink-500 to-rose-500",
    mediaUrl: null,
    href: "/sparks",
    progress: 12,
    status: "unread",
  },
];

/* ─── Data helpers (server-only) ─── */

import { hasSupabaseEnv } from "@/lib/config";
import { allowDemoContent } from "@/lib/domain/demo-env";
import { getDailyMissionProgress } from "@/lib/domain/learning";
import { getCachedUserProfile } from "@/lib/domain/profiles.server";
import {
  type ActiveStory,
  getActiveStories,
  getCachedSocialFeed,
  getFollowingFeed,
  getExplorePosts,
  getSuggestedCreators,
  isFollowing,
  type SocialFeedPost,
} from "@/lib/domain/social";
import { getTeacherFeedInsights } from "@/lib/domain/teacher-inbox";
import { buildDemoPosts, buildDemoSuggestedCreators } from "@/lib/i18n/demo-feed";
import { getServerMessages } from "@/lib/i18n/server";
import { createAdminClient, hasServiceRoleEnv } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function getHomePosts(): Promise<DisplayPost[]> {
  const m = await getServerMessages();

  if (!hasSupabaseEnv()) {
    return allowDemoContent() ? (buildDemoPosts(m.demo) as DisplayPost[]) : [];
  }

  try {
    const supabase = await createClient();
    const profile = await getCachedUserProfile();
    if (!profile) return [];

    // Use admin client for getFollowingFeed to bypass RLS which restricts
    // posts to area-matched content — followers' posts need unrestricted read access
    const feedClient = (hasServiceRoleEnv() ? createAdminClient() : null) ?? supabase;
    let followingPosts = await getFollowingFeed(feedClient, profile.id).catch(() => []);

    // Eğer kullanıcının takip ettiği kişilerin hiç gönderisi yoksa (örn. yeni kayıt)
    // boş ekran yerine global keşfet gönderilerini (popüler olanları) fallback olarak göster.
    if (followingPosts.length === 0) {
      followingPosts = await getExplorePosts(supabase, profile.id, "", 30).catch(() => []);
    }

    if (followingPosts.length === 0) return [];

    // Limit display total to 20 for faster initial load
    const slicedPosts = followingPosts.slice(0, 20);

    // Single batch query for following status — avoids N individual round-trips
    const followedAuthorIds = slicedPosts
      .map((post) => post.author?.id)
      .filter((id): id is string => Boolean(id) && id !== profile?.id);

    let followedSet = new Set<string>();
    if (profile && followedAuthorIds.length > 0) {
      const { data: followRows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", profile.id)
        .in("following_id", followedAuthorIds);
      if (followRows) {
        followedSet = new Set(followRows.map((r) => r.following_id).filter(Boolean) as string[]);
      }
    }

    return slicedPosts.map((post, index) =>
      toDisplayPost(post, index, {
        canFollowCreator: Boolean(profile && post.author?.id && post.author.id !== profile.id),
        isFollowingCreator: Boolean(post.author?.id && followedSet.has(post.author.id)),
        viewerRole: profile?.role ?? null,
        viewerId: profile?.id ?? null,
      }),
    );
  } catch {
    return allowDemoContent() ? (buildDemoPosts(m.demo) as DisplayPost[]) : [];
  }
}

export async function getHomeStories(viewer: { showStudentStrip: boolean; missionDone: number; missionTotal: number }) {
  const m = await getServerMessages();
  const fe = m.feedEnhancements;
  const fx = m.feedExtras;
  let stories: DisplayStory[] = [];

  if (!hasSupabaseEnv()) {
    if (!allowDemoContent()) return [];
    stories = demoStories
      .filter((story) => story.id !== "your-story")
      .map((story) => ({
        ...story,
        name: story.name,
        showNewBadge: story.status === "unread",
      }));
  } else {
    try {
      const supabase = await createClient();
      const [profile, activeStories] = await Promise.all([
        getCachedUserProfile(),
        getActiveStories(supabase),
      ]);
      const createStoryEntry: DisplayStory[] =
        profile?.role === "teacher" && profile.is_verified
          ? [
              {
                id: "your-story",
                creatorId: profile.id,
                name: fx.yourSpark,
                handle: "create",
                accent: "from-crystal to-fuchsia-500",
                mediaUrl: null,
                href: "/create?mode=spark",
                progress: 0,
                status: "create",
              },
            ]
          : [];

      stories = [
        ...createStoryEntry,
        ...groupStoriesByCreator(activeStories).map((story) => toDisplayStory(story)),
      ];
    } catch {
      if (!allowDemoContent()) return [];
      stories = demoStories
        .filter((story) => story.id !== "your-story")
        .map((story) => ({
          ...story,
          showNewBadge: story.status === "unread",
        }));
    }
  }

  if (!viewer.showStudentStrip) return stories;

  const missionProgress = Math.round((viewer.missionDone / Math.max(viewer.missionTotal, 1)) * 100);
  const dailyMission: DisplayStory = {
    id: "daily-mission",
    creatorId: null,
    name: fe.dailyMission,
    handle: fe.dailyMission,
    accent: "from-amber-400 to-orange-500",
    mediaUrl: null,
    href: "/micro",
    progress: missionProgress,
    status: "unread",
    storyKind: "daily-mission",
    missionMeta: fe.dailyMissionMeta
      .replace("{done}", String(viewer.missionDone))
      .replace("{total}", String(viewer.missionTotal)),
  };

  return [dailyMission, ...stories];
}

function toDisplayStory(story: ActiveStory): DisplayStory {
  const name = story.author?.full_name ?? "Zigo";
  const status = getStoryStatus(story.created_at);
  const isVerifiedTeacher = Boolean(story.author?.is_verified && story.author.role === "teacher");
  return {
    id: story.id,
    creatorId: story.author?.id ?? null,
    name,
    handle: name.toLowerCase().replaceAll(" ", ""),
    accent: "from-crystal to-fuchsia-500",
    mediaUrl: story.media_url,
    progress: getStoryProgress(story.created_at),
    href: story.author?.id ? `/sparks?creatorId=${story.author.id}` : "/sparks",
    status,
    showLiveBadge: isVerifiedTeacher && status === "unread" && Date.now() - new Date(story.created_at).getTime() < 1000 * 60 * 60,
    showNewBadge: !isVerifiedTeacher && status === "unread",
  };
}

function getStoryStatus(createdAt: string): DisplayStory["status"] {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  return ageMs < 1000 * 60 * 60 * 8 ? "unread" : "watched";
}

function getStoryProgress(createdAt: string) {
  const ageMs = Math.max(0, Date.now() - new Date(createdAt).getTime());
  const storyWindowMs = 1000 * 60 * 60 * 24;
  return Math.min(96, Math.max(8, Math.round((ageMs / storyWindowMs) * 100)));
}

function groupStoriesByCreator(stories: ActiveStory[]) {
  const grouped = new Map<string, ActiveStory>();

  for (const story of stories) {
    const key = story.author?.id ?? story.id;
    if (!grouped.has(key)) {
      grouped.set(key, story);
    }
  }

  return [...grouped.values()];
}

export function toDisplayPost(
  post: SocialFeedPost,
  index: number,
  followState: {
    canFollowCreator?: boolean;
    isFollowingCreator?: boolean;
    viewerRole?: "teacher" | "parent" | "student" | null;
    viewerId?: string | null;
  } = {},
): DisplayPost {
  const authorName = post.author?.full_name ?? "Zigo Creator";
  return {
    postId: post.id,
    authorId: post.author?.id,
    authorName,
    coAuthorId: post.co_author?.id,
    coAuthorName: post.co_author?.full_name,
    handle: authorName.toLowerCase().replaceAll(" ", ""),
    verified: Boolean(post.author?.is_verified),
    caption: post.caption,
    gradient:
      index % 3 === 0
        ? "from-violet-600 via-fuchsia-500 to-rose-400"
        : index % 3 === 1
          ? "from-emerald-500 via-teal-500 to-cyan-500"
          : "from-amber-400 via-orange-500 to-rose-500",
    likes: post.likes_count,
    comments: post.comments_count,
    badge: post.is_reel ? "Micro" : "Post",
    area: displayEducationAreaName(post.area?.area_name) || "Eşleşen öğrenme",
    areaId: post.area_id ?? undefined,
    mediaUrl: post.media_url,
    mediaType: post.media_type,
    isLiked: post.is_liked,
    isSaved: post.is_saved,
    isFollowingCreator: Boolean(followState.isFollowingCreator),
    canFollowCreator: Boolean(followState.canFollowCreator),
    isOwner: Boolean(followState.viewerId && post.author?.id && followState.viewerId === post.author.id),
    createdAt: post.created_at,
    premiumPrepLabel: post.premium_prep_label ?? undefined,
    showPremiumPrep: Boolean(
      post.has_premium_prep &&
        post.premium_prep_label &&
        (followState.viewerRole === "student" || followState.viewerRole === "parent"),
    ),
    canOpenPremiumPrep: post.can_open_premium_prep,
    sponsoredLabel: post.sponsored_label ?? undefined,
    sponsoredDisclosure: post.sponsored_disclosure,
    showSponsored: Boolean(post.has_sponsored && post.sponsored_label),
    canOpenSponsored: post.can_open_sponsored,
    isSponsoredActive: post.is_sponsored_active,
    avatarUrl: post.author?.avatar_url ?? null,
    locationName: (post as unknown as { location_name?: string | null }).location_name ?? null,
    city: (post as unknown as { city?: string | null }).city ?? null,
    district: (post as unknown as { district?: string | null }).district ?? null,
  };
}

export async function getHomeViewerContext(): Promise<{
  showStudentStrip: boolean;
  points: number;
  streakDays: number;
  missionDone: number;
  missionTotal: number;
  role: "teacher" | "parent" | "student" | null;
}> {
  if (!hasSupabaseEnv()) {
    return allowDemoContent()
      ? { showStudentStrip: true, points: 240, streakDays: 3, missionDone: 1, missionTotal: 5, role: "student" }
      : { showStudentStrip: false, points: 0, streakDays: 0, missionDone: 0, missionTotal: 5, role: null };
  }

  try {
    const supabase = await createClient();
    const profile = await getCachedUserProfile();
    if (!profile || profile.role !== "student") {
      return {
        showStudentStrip: false,
        points: 0,
        streakDays: 0,
        missionDone: 0,
        missionTotal: 5,
        role: profile?.role ?? null,
      };
    }

    const missions = await getDailyMissionProgress(supabase, profile.id);
    const missionTotal = 5;
    const missionDone = Math.min(missionTotal, missions.completedIds.length);

    return {
      showStudentStrip: true,
      points: profile.total_points ?? 0,
      streakDays: Math.max(0, missions.streakDays),
      missionDone,
      missionTotal,
      role: "student",
    };
  } catch {
    return { showStudentStrip: false, points: 0, streakDays: 0, missionDone: 0, missionTotal: 5, role: null };
  }
}

export async function getHomeTeacherInsights(): Promise<HomeTeacherInsights> {
  if (!hasSupabaseEnv()) return null;

  try {
    const supabase = await createClient();
    const profile = await getCachedUserProfile();
    if (!profile || profile.role !== "teacher") return null;
    return await getTeacherFeedInsights(supabase, profile.id);
  } catch {
    return null;
  }
}

export function buildReelSpotlights(posts: DisplayPost[], fallback: ReelSpotlightItem[]): ReelSpotlightItem[] {
  const fromPosts = posts
    .filter((post) => post.badge === "Micro" || post.mediaType === "video")
    .slice(0, 3)
    .map((post) => ({
      title: post.caption.slice(0, 28) || post.area,
      creator: post.handle,
      gradient: post.gradient,
      scene: post.scene ?? "math",
      mediaUrl: post.mediaUrl,
      mediaType: post.mediaType,
      href: post.postId ? `/post/${post.postId}` : "/micro",
    }));

  if (fromPosts.length > 0) return fromPosts;

  return fallback;
}

export async function getSuggestedCreatorsForHome(): Promise<DisplaySuggestedCreator[]> {
  if (!hasSupabaseEnv()) {
    const m = await getServerMessages();
    return allowDemoContent() ? buildDemoSuggestedCreators(m.demo) : [];
  }

  try {
    const supabase = await createClient();
    const profile = await getCachedUserProfile();
    const creators = await getSuggestedCreators(supabase, profile?.id);
    if (creators.length === 0) {
      return [];
    }

    return creators.map((creator) => ({
      id: creator.id,
      name: creator.full_name,
      handle: creator.full_name.toLowerCase().replaceAll(" ", ""),
      area: displayEducationAreaName(creator.area_name),
      href: `/profile/${creator.id}`,
      isFollowing: creator.is_following,
    }));
  } catch {
    return [];
  }
}

