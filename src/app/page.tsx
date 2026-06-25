import Link from "next/link";

import { DismissibleFeedPost } from "@/components/dismissible-feed-post";
import { DoubleTapLikeLink } from "@/components/double-tap-like-link";
import { FeedEducationBadges } from "@/components/feed-education-badges";
import { FeedRefreshControl } from "@/components/feed-refresh-control";
import { FollowButton } from "@/components/follow-button";
import { PostOptionsButton } from "@/components/post-options-button";
import { PremiumPrepLink } from "@/components/premium-prep-link";
import { SocialMediaFrame } from "@/components/social-media-frame";
import type { SocialMediaSceneName } from "@/components/social-media-scenes";
import { SocialPostActions } from "@/components/social-post-actions";
import { SocialAvatar } from "@/components/social-primitives";
import { SponsoredAdLink } from "@/components/sponsored-ad-link";
import { StudentSocialStrip } from "@/components/student-social-strip";
import { StudyWithMeRail } from "@/components/study-with-me-rail";
import { TeacherHomeInsights } from "@/components/teacher-home-insights";
import { TeacherTrustBadges } from "@/components/teacher-trust-badges";
import { TodayLearningCard } from "@/components/today-learning-card";
import { hasSupabaseEnv } from "@/lib/config";
import { allowDemoContent } from "@/lib/domain/demo-env";
import { getDailyMissionProgress } from "@/lib/domain/learning";
import { getCurrentProfile } from "@/lib/domain/profiles";
import {
  type ActiveStory,
  getActiveStories,
  getCachedSocialFeed,
  getFollowingFeed,
  getSuggestedCreators,
  isFollowing,
  type SocialFeedPost,
} from "@/lib/domain/social";
import { getMatchedStudyMoments } from "@/lib/domain/study-moments";
import { getTeacherFeedInsights } from "@/lib/domain/teacher-inbox";
import { formatFeedTimestamp } from "@/lib/format-time";
import { buildDemoPosts, buildDemoSuggestedCreators } from "@/lib/i18n/demo-feed";
import { getServerMessages, type Messages } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

const demoStories: DisplayStory[] = [
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

type DisplaySuggestedCreator = {
  id?: string;
  name: string;
  handle: string;
  area: string;
  href: string;
  isFollowing: boolean;
};

type ReelSpotlightItem = {
  title: string;
  creator: string;
  gradient: string;
  scene: SocialMediaSceneName;
  mediaUrl?: string | null;
  mediaType?: string;
  href: string;
};

type DisplayPost = {
  postId?: string;
  authorId?: string;
  authorName: string;
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
};

type DisplayStory = {
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

type HomeTeacherInsights = {
  inboxCount: number;
  postCount: number;
} | null;

type HomePageProps = {
  searchParams: Promise<{ feed?: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const m = await getServerMessages();
  const params = await searchParams;
  const activeFeed = params.feed === "following" ? "following" : "for-you";
  const viewer = await getHomeViewerContext();
  const [posts, stories, suggestedCreators, studyMoments, teacherInsights] = await Promise.all([
    getHomePosts(activeFeed),
    getHomeStories(viewer),
    getSuggestedCreatorsForHome(),
    getHomeStudyMoments(),
    getHomeTeacherInsights(),
  ]);
  const reelDemoFallback = allowDemoContent()
    ? buildDemoPosts(m.demo).slice(0, 3).map((post) => ({
        title: post.area,
        creator: post.handle,
        gradient: post.gradient,
        scene: post.scene ?? "math",
        href: "/micro",
        mediaUrl: null,
        mediaType: "image",
      }))
    : [];
  const reelSpotlights = buildReelSpotlights(posts, reelDemoFallback);

  return (
    <div className="space-y-4 pb-3">
      {teacherInsights ? (
        <TeacherHomeInsights
          copy={m.feedEnhancements}
          inboxCount={teacherInsights.inboxCount}
          postCount={teacherInsights.postCount}
        />
      ) : null}

      {stories.length > 0 ? (
        <section className="-mx-4 border-b border-slate-100 bg-white px-4 pb-3 pt-1">
          <div className="no-scrollbar flex gap-4 overflow-x-auto pb-1">
            {stories.map((story) => (
              <StoryTrayItem feedExtras={m.feedExtras} feedEnhancements={m.feedEnhancements} key={story.id} story={story} />
            ))}
          </div>
        </section>
      ) : null}

      {viewer.showStudentStrip ? <StudentSocialStrip points={viewer.points} streakDays={viewer.streakDays} /> : null}

      {viewer.showStudentStrip ? <StudyWithMeRail moments={studyMoments} showPreview={false} /> : null}

      <FeedRefreshControl activeFeed={activeFeed} />

      <TodayLearningCard copy={m.feedEnhancements} />

      {posts.length > 0 ? <ReelSpotlightRail messages={m} spotlights={reelSpotlights} /> : null}

      {activeFeed === "following" ? null : (
        <section className="-mx-4 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-2">
          <p className="text-zigo-caption font-semibold text-slate-600">
            {m.feed.suggested}{" "}
            <span className="sr-only">{m.feed.selectedAreas}</span>
          </p>
          <Link className="text-zigo-caption font-bold text-crystal" href="/?feed=following">
            {m.feed.following}
          </Link>
        </section>
      )}

      <section className="space-y-0">
        {activeFeed === "following" && posts.length === 0 ? (
          <FollowingStarter creators={suggestedCreators} messages={m} />
        ) : posts.length === 0 ? (
          <ForYouStarter messages={m} />
        ) : (
          posts.map((post, index) => (
            <div key={post.postId ?? post.handle}>
              <FeedPostCard
                feedEnhancements={m.feedEnhancements}
                feedExtras={m.feedExtras}
                post={post}
                priorityMedia={index === 0}
                teacherBadges={m.teacherBadges}
              />
              {index === 3 ? (
                <CreatorRail creators={suggestedCreators} label={m.feed.suggested} seeAll={m.common.seeAll} />
              ) : null}
            </div>
          ))
        )}
      </section>
    </div>
  );
}

function StoryTrayItem({
  story,
  feedExtras: f,
  feedEnhancements: fe,
}: {
  story: DisplayStory;
  feedExtras: Messages["feedExtras"];
  feedEnhancements: Messages["feedEnhancements"];
}) {
  const statusLabel =
    story.storyKind === "daily-mission"
      ? fe.dailyMission
      : story.status === "create"
        ? f.createStory
        : story.status === "unread"
          ? f.unreadStory
          : f.watchedStory;
  const ringClass =
    story.storyKind === "daily-mission"
      ? "bg-gradient-to-br from-amber-400 to-orange-500"
      : story.status === "watched"
        ? "bg-slate-200"
        : story.status === "create"
          ? "bg-gradient-to-br from-crystal to-fuchsia-500"
          : `bg-gradient-to-br ${story.accent} story-ring-unread`;

  return (
    <Link
      aria-label={`${statusLabel}: ${story.handle}`}
      className="tap-scale group min-w-16 text-center"
      href={story.href}
    >
      <span
        className={`relative mx-auto flex size-[4.7rem] items-center justify-center rounded-full p-0.5 ${
          story.status === "unread" || story.storyKind === "daily-mission" ? "story-live-pulse" : ""
        } ${ringClass}`}
      >
        <SocialAvatar
          accent={story.status === "watched" ? "from-slate-200 to-slate-200" : story.accent}
          className="size-full"
          imageUrl={story.mediaUrl}
          label={story.name}
          ring={false}
        />
        {story.status === "create" ? (
          <span className="absolute bottom-0 right-1 flex size-5 items-center justify-center rounded-full border-2 border-white bg-crystal text-sm font-black leading-none text-white">
            +
          </span>
        ) : story.showLiveBadge ? (
          <span className="zigo-badge-count absolute -right-0.5 top-0 rounded-full bg-rose-500 px-1.5 py-0.5 text-white">
            {fe.liveLesson}
          </span>
        ) : story.showNewBadge ? (
          <span className="zigo-badge-count absolute -right-0.5 top-0 rounded-full bg-crystal px-1.5 py-0.5 text-white">
            {fe.newLesson}
          </span>
        ) : story.storyKind === "daily-mission" ? (
          <span className="absolute inset-1 rounded-full border-2 border-white/80" style={{ clipPath: `inset(0 ${100 - story.progress}% 0 0)` }} />
        ) : (
          <span className="sr-only">{f.storyProgress.replace("{progress}", String(story.progress))}</span>
        )}
      </span>
      <span className="zigo-fit-text mt-2 block max-w-[4.5rem] text-center text-xs font-bold leading-tight text-slate-700">
        {story.storyKind === "daily-mission" ? fe.dailyMission : story.handle}
      </span>
      {story.missionMeta ? (
        <span className="zigo-fit-text block max-w-[4.5rem] text-center text-zigo-micro font-semibold text-crystal">{story.missionMeta}</span>
      ) : null}
    </Link>
  );
}

function ReelSpotlightRail({ messages, spotlights }: { messages: Messages; spotlights: ReelSpotlightItem[] }) {
  const f = messages.feed;

  return (
    <section className="-mx-4 px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-zigo-body font-bold text-night">{f.microToWatch}</p>
          <p className="mt-0.5 text-zigo-caption text-slate-600">{f.fastVerified}</p>
        </div>
        <Link className="text-zigo-caption font-bold text-crystal" href="/micro">
          {f.open}
        </Link>
      </div>
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
        {spotlights.map((reel) => (
          <Link className="tap-scale min-w-28 overflow-hidden text-white" href={reel.href} key={`${reel.creator}-${reel.title}`}>
            <SocialMediaFrame
              alt={reel.title}
              className="h-44"
              gradient={reel.gradient}
              mediaType={reel.mediaType}
              mediaUrl={reel.mediaUrl}
              scene={reel.scene}
            >
              <div className="flex justify-end">
                <span className="flex size-8 items-center justify-center rounded-lg bg-black/25 backdrop-blur">
                  <svg aria-hidden="true" className="ml-0.5 size-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </div>
              <div>
                <p className="text-zigo-title-sm font-bold leading-tight">{reel.title}</p>
                <p className="mt-1 text-zigo-meta font-semibold text-white/80">@{reel.creator}</p>
              </div>
            </SocialMediaFrame>
          </Link>
        ))}
      </div>
    </section>
  );
}

async function getHomePosts(activeFeed: "for-you" | "following"): Promise<DisplayPost[]> {
  const m = await getServerMessages();

  if (!hasSupabaseEnv()) {
    return allowDemoContent() ? (buildDemoPosts(m.demo) as DisplayPost[]) : [];
  }

  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    const socialPosts =
      activeFeed === "following" && profile
        ? await getFollowingFeed(supabase, profile.id)
        : (await getCachedSocialFeed(supabase, profile?.id)).posts;

    if (socialPosts.length === 0) return [];

    const followingByPost = await Promise.all(
      socialPosts.map((post) =>
        profile && post.author?.id && post.author.id !== profile.id
          ? isFollowing(supabase, profile.id, post.author.id)
          : Promise.resolve(false),
      ),
    );

    return socialPosts.map((post, index) =>
      toDisplayPost(post, index, {
        canFollowCreator: Boolean(profile && post.author?.id && post.author.id !== profile.id),
        isFollowingCreator: followingByPost[index] ?? false,
        viewerRole: profile?.role ?? null,
      }),
    );
  } catch {
    return allowDemoContent() ? (buildDemoPosts(m.demo) as DisplayPost[]) : [];
  }
}

async function getHomeStories(viewer: { showStudentStrip: boolean; missionDone: number; missionTotal: number }) {
  const m = await getServerMessages();
  const fe = m.feedEnhancements;
  const fx = m.feedExtras;
  let stories: DisplayStory[] = [];

  if (!hasSupabaseEnv()) {
    if (!allowDemoContent()) return [];
    stories = demoStories.map((story) => ({
      ...story,
      name: story.id === "your-story" ? fx.yourSpark : story.name,
      showNewBadge: story.status === "unread",
    }));
  } else {
    try {
      const supabase = await createClient();
      const [profile, activeStories] = await Promise.all([
        getCurrentProfile(supabase),
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
                href: "/create?mode=story",
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
      stories = demoStories.map((story) => ({
        ...story,
        name: story.id === "your-story" ? fx.yourSpark : story.name,
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

function toDisplayPost(
  post: SocialFeedPost,
  index: number,
  followState: {
    canFollowCreator?: boolean;
    isFollowingCreator?: boolean;
    viewerRole?: "teacher" | "parent" | "student" | null;
  } = {},
): DisplayPost {
  const authorName = post.author?.full_name ?? "Zigo Creator";
  return {
    postId: post.id,
    authorId: post.author?.id,
    authorName,
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
    area: post.area?.area_name ?? "Eşleşen öğrenme",
    mediaUrl: post.media_url,
    mediaType: post.media_type,
    isLiked: post.is_liked,
    isSaved: post.is_saved,
    isFollowingCreator: Boolean(followState.isFollowingCreator),
    canFollowCreator: Boolean(followState.canFollowCreator),
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
  };
}

async function getHomeStudyMoments() {
  if (!hasSupabaseEnv()) return [];

  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile || profile.role !== "student") return [];
    return await getMatchedStudyMoments(supabase);
  } catch {
    return [];
  }
}

async function getHomeViewerContext(): Promise<{
  showStudentStrip: boolean;
  points: number;
  streakDays: number;
  missionDone: number;
  missionTotal: number;
}> {
  if (!hasSupabaseEnv()) {
    return allowDemoContent()
      ? { showStudentStrip: true, points: 240, streakDays: 3, missionDone: 1, missionTotal: 2 }
      : { showStudentStrip: false, points: 0, streakDays: 0, missionDone: 0, missionTotal: 2 };
  }

  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile || profile.role !== "student") {
      return { showStudentStrip: false, points: 0, streakDays: 0, missionDone: 0, missionTotal: 2 };
    }

    const missions = await getDailyMissionProgress(supabase, profile.id);
    const missionTotal = 2;
    const missionDone = Math.min(missionTotal, missions.completedIds.length);

    return {
      showStudentStrip: true,
      points: profile.total_points ?? 0,
      streakDays: Math.max(0, missions.streakDays),
      missionDone,
      missionTotal,
    };
  } catch {
    return { showStudentStrip: false, points: 0, streakDays: 0, missionDone: 0, missionTotal: 2 };
  }
}

async function getHomeTeacherInsights(): Promise<HomeTeacherInsights> {
  if (!hasSupabaseEnv()) return null;

  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile || profile.role !== "teacher") return null;
    return await getTeacherFeedInsights(supabase, profile.id);
  } catch {
    return null;
  }
}

function buildReelSpotlights(posts: DisplayPost[], fallback: ReelSpotlightItem[]): ReelSpotlightItem[] {
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

async function getSuggestedCreatorsForHome(): Promise<DisplaySuggestedCreator[]> {
  if (!hasSupabaseEnv()) {
    const m = await getServerMessages();
    return allowDemoContent() ? buildDemoSuggestedCreators(m.demo) : [];
  }

  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    const creators = await getSuggestedCreators(supabase, profile?.id);
    if (creators.length === 0) {
      return [];
    }

    return creators.map((creator) => ({
      id: creator.id,
      name: creator.full_name,
      handle: creator.full_name.toLowerCase().replaceAll(" ", ""),
      area: creator.area_name,
      href: `/profile/${creator.id}`,
      isFollowing: creator.is_following,
    }));
  } catch {
    return [];
  }
}

function CreatorRail({
  creators,
  label,
  seeAll,
}: {
  creators: DisplaySuggestedCreator[];
  label: string;
  seeAll: string;
}) {
  return (
    <section className="-mx-4 px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-zigo-body font-bold text-night">{label}</p>
        <Link className="text-zigo-caption font-bold text-crystal" href="/explore?format=teachers">
          {seeAll}
        </Link>
      </div>
      <div className="no-scrollbar flex gap-3 overflow-x-auto">
        {creators.map((creator) => (
          <article className="min-w-28 text-center" key={creator.id ?? creator.handle}>
            <Link className="tap-scale block" href={creator.href}>
              <SocialAvatar className="mx-auto size-16" label={creator.name} />
              <p className="zigo-fit-text mt-2 text-zigo-caption font-bold text-night">{creator.handle}</p>
              <p className="zigo-fit-text mt-0.5 text-zigo-meta text-slate-600">{creator.area}</p>
            </Link>
            <div className="mt-2 flex justify-center">
              <FollowButton
                followingId={creator.id}
                initialFollowing={creator.isFollowing}
                variant="compact"
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function FollowingStarter({
  creators,
  messages,
}: {
  creators: DisplaySuggestedCreator[];
  messages: Messages;
}) {
  const f = messages.feedExtras;
  return (
    <section className="-mx-4 px-6 py-14 text-center">
      <span className="mx-auto flex size-20 items-center justify-center rounded-lg border-2 border-night text-2xl font-black text-night">
        +
      </span>
      <h2 className="zigo-section-title mt-4 text-night">{f.followCreators}</h2>
      <p className="mx-auto mt-2 max-w-72 text-zigo-body leading-relaxed text-slate-600">{f.followCreatorsDesc}</p>
      <Link className="tap-scale mt-4 inline-flex zigo-cta tap-scale rounded-lg px-5 py-2.5 text-zigo-body font-bold text-white" href="/explore?q=Teachers">
        {f.exploreTeachers}
      </Link>
      <div className="no-scrollbar mt-6 flex gap-3 overflow-x-auto pb-1 text-left">
        {creators.map((creator) => (
          <article className="min-w-32 rounded-lg border border-slate-200 bg-white p-3" key={creator.id ?? creator.handle}>
            <Link className="tap-scale block" href={creator.href}>
              <SocialAvatar className="size-10" label={creator.name} ring={false} />
              <p className="zigo-fit-text mt-3 text-zigo-body font-bold text-night">@{creator.handle}</p>
              <p className="mt-1 text-zigo-caption text-slate-600">{creator.area}</p>
            </Link>
            <div className="mt-3">
              <FollowButton followingId={creator.id} initialFollowing={creator.isFollowing} variant="compact" />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ForYouStarter({ messages }: { messages: Messages }) {
  const f = messages.feedExtras;
  const o = messages.onboarding;
  return (
    <section className="-mx-4 px-6 py-14 text-center">
      <span className="mx-auto flex size-20 items-center justify-center rounded-lg bg-gradient-to-br from-crystal to-fuchsia-500 text-2xl font-black text-white">
        Z
      </span>
      <h2 className="zigo-section-title mt-4 text-night">{f.buildFeed}</h2>
      <p className="mx-auto mt-2 max-w-72 text-zigo-body leading-relaxed text-slate-600">{f.buildFeedDesc}</p>
      <Link className="tap-scale mt-4 inline-flex zigo-cta tap-scale rounded-lg px-5 py-2.5 text-zigo-body font-bold text-white" href="/onboarding">
        {o.chooseInterests}
      </Link>
    </section>
  );
}

function FeedPostCard({
  post,
  teacherBadges,
  feedExtras,
  feedEnhancements,
  priorityMedia = false,
}: {
  post: DisplayPost;
  teacherBadges: { verifiedTeacher: string; moreAreas: string };
  feedExtras: Messages["feedExtras"];
  feedEnhancements: Messages["feedEnhancements"];
  priorityMedia?: boolean;
}) {
  const postKey = post.postId ?? post.handle;

  return (
    <DismissibleFeedPost postKey={postKey}>
      <article className="zigo-feed-card -mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5">
          <Link className="flex min-w-0 flex-1 items-center gap-3" href={post.authorId ? `/profile/${post.authorId}` : "/profile"}>
            <SocialAvatar className="size-9" label={post.authorName} />
            <div className="min-w-0">
              <p className="truncate text-zigo-body font-bold text-night">{post.handle}</p>
              {post.verified ? (
                <div className="mt-1">
                  <TeacherTrustBadges
                    branches={post.area ? [post.area] : []}
                    moreLabel={teacherBadges.moreAreas}
                    showVerified
                    verified={post.verified}
                    verifiedLabel={teacherBadges.verifiedTeacher}
                  />
                </div>
              ) : (
                <p className="truncate text-zigo-meta font-semibold text-slate-600">{post.area}</p>
              )}
            </div>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <PostOptionsButton initialSaved={post.isSaved} postId={post.postId} postKey={postKey} />
          </div>
        </div>

        <DoubleTapLikeLink
          href={post.postId ? `/post/${post.postId}` : "/micro"}
          initialLiked={post.isLiked}
          postId={post.postId}
        >
          <SocialMediaFrame
            alt={post.caption.slice(0, 80)}
            className="zigo-media border-y border-slate-50"
            gradient={post.gradient}
            mediaType={post.mediaType}
            mediaUrl={post.mediaUrl}
            priority={priorityMedia}
            scene={post.scene}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="zigo-meta-badge rounded-full bg-black/25 px-2.5 py-1 text-white backdrop-blur">
                  {post.badge}
                </span>
                <span className="zigo-meta-badge rounded-full bg-white/20 px-2.5 py-1 text-white backdrop-blur">
                  {post.area}
                </span>
              </div>
              {post.mediaType === "video" ? (
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-black/25 text-xs font-black text-white backdrop-blur">
                  <svg aria-hidden="true" className="ml-0.5 size-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              ) : null}
            </div>
            <div />
          </SocialMediaFrame>
        </DoubleTapLikeLink>

        <div className="space-y-2 px-4 pb-3 pt-2.5">
          <SocialPostActions
            initialComments={post.comments}
            initialLiked={post.isLiked}
            initialLikes={post.likes}
            initialSaved={post.isSaved}
            postId={post.postId}
            variant="compact"
          />
          <FeedEducationBadges
            area={post.area}
            badge={post.badge}
            copy={feedEnhancements}
            isMicro={post.badge === "Micro" || post.mediaType === "video"}
            postId={post.postId}
          />
          <p className="text-zigo-body leading-relaxed text-slate-800">
            <span className="font-bold text-night">{post.handle}</span> {post.caption}
          </p>
          {post.showPremiumPrep && post.premiumPrepLabel && post.postId ? (
            <PremiumPrepLink
              canOpen={Boolean(post.canOpenPremiumPrep)}
              label={post.premiumPrepLabel}
              postId={post.postId}
            />
          ) : null}
          {post.showSponsored && post.sponsoredLabel && post.postId ? (
            <SponsoredAdLink
              canOpen={Boolean(post.canOpenSponsored)}
              disclosure={post.sponsoredDisclosure}
              isActive={post.isSponsoredActive ?? true}
              label={post.sponsoredLabel}
              postId={post.postId}
            />
          ) : null}
          <Link className="block text-sm font-semibold text-slate-600" href={post.postId ? `/post/${post.postId}` : "/micro"}>
            {post.comments > 0
              ? feedExtras.viewAllComments.replace("{count}", post.comments.toLocaleString())
              : feedExtras.addFirstComment}
          </Link>
          <p className="text-zigo-meta font-semibold uppercase tracking-wide text-slate-500">
            {formatFeedTimestamp(post.createdAt)}
          </p>
        </div>
      </article>
    </DismissibleFeedPost>
  );
}
