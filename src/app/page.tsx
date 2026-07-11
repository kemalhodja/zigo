import Link from "next/link";

import { FeedRefreshControl } from "@/components/feed-refresh-control";
import { StudentSocialStrip } from "@/components/student-social-strip";
import { StudyWithMeRail } from "@/components/study-with-me-rail";
import { TeacherHomeInsights } from "@/components/teacher-home-insights";
import { TodayLearningCard } from "@/components/today-learning-card";
import { allowDemoContent } from "@/lib/domain/demo-env";
import { buildDemoPosts } from "@/lib/i18n/demo-feed";
import { getServerMessages } from "@/lib/i18n/server";

import {
  buildReelSpotlights,
  getHomePosts,
  getHomeStories,
  getHomeStudyMoments,
  getHomeTeacherInsights,
  getHomeViewerContext,
  getSuggestedCreatorsForHome,
} from "./_components/home/data";
import { HomeLearningPulse } from "./_components/home/learning-pulse";
import { CreatorRail, FeedPostCard, FollowingStarter, ForYouStarter } from "./_components/home/match-feed";
import { StoryTray } from "./_components/home/story-tray";
import { ReelSpotlightRail } from "./_components/home/study-rail";

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
  const showStudentHomeModules = viewer.role === "student" || viewer.role === null;

  return (
    <div className="space-y-4 pb-3">
      {teacherInsights ? (
        <TeacherHomeInsights
          copy={m.feedEnhancements}
          inboxCount={teacherInsights.inboxCount}
          postCount={teacherInsights.postCount}
        />
      ) : null}

      <HomeLearningPulse />

      <StoryTray stories={stories} feedExtras={m.feedExtras} feedEnhancements={m.feedEnhancements} />

      {viewer.showStudentStrip ? <StudentSocialStrip points={viewer.points} streakDays={viewer.streakDays} /> : null}

      {viewer.showStudentStrip ? <StudyWithMeRail moments={studyMoments} showPreview={false} /> : null}

      <FeedRefreshControl activeFeed={activeFeed} />

      {showStudentHomeModules ? <TodayLearningCard copy={m.feedEnhancements} /> : null}

      {showStudentHomeModules && posts.length > 0 ? <ReelSpotlightRail messages={m} spotlights={reelSpotlights} /> : null}

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

