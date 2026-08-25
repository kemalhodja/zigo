import dynamic from "next/dynamic";
import Link from "next/link";

const AiMentorCard = dynamic(() => import("@/components/ai-mentor-card").then(mod => mod.AiMentorCard));
import { PublicPreviewFeed } from "@/components/public-preview-feed";
import { allowDemoContent } from "@/lib/domain/demo-env";
import { buildDemoPosts } from "@/lib/i18n/demo-feed";
import { getServerMessages } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

import {
  buildReelSpotlights,
  getHomePosts,
  getHomeStories,
  getHomeViewerContext,
  getSuggestedCreatorsForHome,
} from "../_components/home/data";
import { HomeMissionStrip } from "../_components/home/mission-strip";
import { StoryTray } from "../_components/home/story-tray";
import { ReelSpotlightRail } from "../_components/home/study-rail";
import { VirtualFeedClient } from "../_components/home/virtual-feed-client";

export default async function HomePage() {
  const m = await getServerMessages();
  const viewer = await getHomeViewerContext();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return <PublicPreviewFeed />;
  }

  const [posts, stories, suggestedCreators] = await Promise.all([
    getHomePosts(),
    getHomeStories(viewer),
    getSuggestedCreatorsForHome(),
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

  return (
    <div className="flex flex-col pb-4 bg-white md:bg-transparent md:gap-6">
      {/* Mobile Feed Header */}
      <div className="md:hidden sticky top-0 z-50 flex items-center justify-between bg-white px-4 pb-3" style={{ paddingTop: 'max(12px, env(safe-area-inset-top, 12px))' }}>
        <Link href="/create" className="text-night">
          <svg aria-hidden="true" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </Link>
        <button className="flex items-center gap-1 font-bold text-xl text-night">
          Senin için
          <svg aria-hidden="true" className="size-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <Link href="/notifications" className="text-night">
          <svg aria-hidden="true" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </Link>
      </div>


      <StoryTray stories={stories} feedExtras={m.feedExtras} feedEnhancements={m.feedEnhancements} />

      {viewer.role === null ? (
        <section className="relative overflow-hidden -mx-4 md:mx-0 md:rounded-3xl bg-slate-950/80 px-8 py-10 text-white backdrop-blur-xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 via-transparent to-fuchsia-500/20 pointer-events-none" />
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-violet-500/30 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-fuchsia-500/30 blur-[80px] rounded-full pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
            <div className="flex-1 space-y-4">
              <div className="inline-flex items-center rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-violet-300">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                </span>
                Zigo'ya Hoş Geldiniz
              </div>
              <h1 className="text-3xl md:text-4xl font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-violet-100 to-fuchsia-200">
                Zigo Plus'ı 30 Gün Ücretsiz Deneyin!
              </h1>
              <p className="text-sm md:text-base font-medium text-slate-300 max-w-xl">
                Kayıt olduktan sonraki ilk 30 gün içinde <strong className="text-fuchsia-400">%50 İndirim Fırsatını</strong> kaçırmayın. Sınırsız deneme çözümleri ve ödüller sizi bekliyor.
              </p>
            </div>
            <div className="w-full md:w-auto flex-shrink-0">
              <Link href="/auth" className="group relative w-full md:w-auto inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-8 py-4 text-base font-black text-white shadow-[0_0_40px_-10px_rgba(139,92,246,0.5)] transition-all hover:scale-105 hover:shadow-[0_0_60px_-15px_rgba(139,92,246,0.7)] active:scale-95">
                <span className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
                <span className="relative flex items-center gap-2">
                  Hemen Kayıt Ol <span className="text-xl group-hover:translate-x-1 transition-transform">🚀</span>
                </span>
              </Link>
            </div>
          </div>
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


      {showStudentHomeModules && posts.length > 0 ? <ReelSpotlightRail messages={m} spotlights={reelSpotlights} /> : null}

      <section className="space-y-0 -mx-4 md:mx-0">
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
