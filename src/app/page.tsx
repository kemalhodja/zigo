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

      {viewer.role === null ? (
        <section className="-mx-4 bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-8 text-slate-950">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-night/70">Zigo'ya Hoş Geldiniz</p>
          <h1 className="mt-2 text-2xl font-black leading-tight">Zigo Plus'ı 30 Gün Ücretsiz Deneyin!</h1>
          <p className="mt-2 text-sm font-bold text-night/80">
            Kayıt olduktan sonraki ilk 30 gün içinde %50 İndirim Fırsatını kaçırmayın. Sınırsız deneme çözümleri ve ödüller sizi bekliyor.
          </p>
          <Link href="/auth" className="mt-4 inline-flex items-center justify-center rounded-xl bg-night px-6 py-3 text-sm font-black text-white shadow-lg transition hover:scale-105 active:scale-95">
            Hemen Kayıt Ol 🚀
          </Link>
        </section>
      ) : null}

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
      <section className="-mx-4 flex items-center justify-between border-b border-slate-800/50 bg-slate-950/98 px-4 py-2.5 backdrop-blur">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-black text-slate-100">{m.feed.following}</h2>
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


// zigo-quick-action-primary text-white DoubleTapLikeLink
