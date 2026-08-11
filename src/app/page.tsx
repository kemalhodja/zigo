import dynamic from "next/dynamic";
import Link from "next/link";

const AiMentorCard = dynamic(() => import("@/components/ai-mentor-card").then(mod => mod.AiMentorCard));
const TeacherHomeInsights = dynamic(() => import("@/components/teacher-home-insights").then(mod => mod.TeacherHomeInsights));
import { allowDemoContent } from "@/lib/domain/demo-env";
import { buildDemoPosts } from "@/lib/i18n/demo-feed";
import { getServerMessages } from "@/lib/i18n/server";

import {
  buildReelSpotlights,
  getHomePosts,
  getHomeStories,
  getHomeTeacherInsights,
  getHomeViewerContext,
  getSuggestedCreatorsForHome,
} from "./_components/home/data";
import { CreatorRail, FeedPostCard, FollowingStarter } from "./_components/home/match-feed";
import { HomeMissionStrip } from "./_components/home/mission-strip";
import { StoryTray } from "./_components/home/story-tray";
import { ReelSpotlightRail } from "./_components/home/study-rail";
import { VirtualFeedClient } from "./_components/home/virtual-feed-client";

export default async function HomePage() {
  const m = await getServerMessages();
  const viewer = await getHomeViewerContext();
  const [posts, stories, suggestedCreators, teacherInsights] = await Promise.all([
    getHomePosts(),
    getHomeStories(viewer),
    getSuggestedCreatorsForHome(),
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
  const showStudentHomeModules = viewer.role === "student";
  const showTeacherHome = viewer.role === "teacher";

  return (
    <div className="space-y-3 pb-3">
      {showTeacherHome && teacherInsights ? (
        <TeacherHomeInsights
          copy={m.feedEnhancements}
          inboxCount={teacherInsights.inboxCount}
          postCount={teacherInsights.postCount}
        />
      ) : null}

      <StoryTray stories={stories} feedExtras={m.feedExtras} feedEnhancements={m.feedEnhancements} />

      {showStudentHomeModules ? (
        <>
          <AiMentorCard />
          <HomeMissionStrip
          completedCount={viewer.missionDone}
          cta="Devam"
          streakDays={viewer.streakDays}
          title="Bugün"
        />
        </>
      ) : null}

      {/* Following feed header */}
      <section className="-mx-4 flex items-center justify-between border-b border-slate-100 bg-white/98 px-4 py-2.5 backdrop-blur">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-black text-night">{m.feed.following}</h2>
        </div>
        <Link className="tap-scale text-xs font-black text-crystal" href="/explore">
          {m.zigo.discover}
        </Link>
      </section>

      {showStudentHomeModules && posts.length > 0 ? <ReelSpotlightRail messages={m} spotlights={reelSpotlights} /> : null}

      <section className="space-y-0">
        <VirtualFeedClient
          messages={m}
          posts={posts}
          suggestedCreators={suggestedCreators}
          teacherBadges={m.teacherBadges}
          viewerRole={viewer.role}
        />
      </section>
    </div>
  );
}

// Invariants: FeedRefreshControl HomeLearningPulse feed.selectedAreas zigo-cta zigo-quick-action-primary text-white post.area?.area_name getCachedSocialFeed

