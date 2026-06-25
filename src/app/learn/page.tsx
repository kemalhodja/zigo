import Link from "next/link";

import { DailyMissionsCard } from "@/components/daily-missions-card";
import { LearnQuizCard } from "@/components/learn-quiz-card";
import { LearnVideoCard } from "@/components/learn-video-card";
import { StateCard } from "@/components/state-card";
import { hasSupabaseEnv, withSupabaseFallback } from "@/lib/config";
import { allowDemoContent } from "@/lib/domain/demo-env";
import { getChildPersonalizedFeed, getChildProfiles } from "@/lib/domain/children";
import { getPersonalizedFeed } from "@/lib/domain/feed";
import { getChildMatchedQuizzes } from "@/lib/domain/learning";
import { getMatchedQuizzes } from "@/lib/domain/learning";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { buildDemoLessons } from "@/lib/i18n/demo-feed";
import { getServerMessages } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export default async function LearnPage() {
  const messages = await getServerMessages();
  const demoLessons = buildDemoLessons(messages.demo);

  if (!hasSupabaseEnv()) {
    if (allowDemoContent()) {
      return <LearnPreview mode="preview" demoLessons={demoLessons} messages={messages} />;
    }
    return (
      <StateCard
        action={<Link className="font-black text-crystal" href="/setup">{messages.preview.setup}</Link>}
        description={messages.preview.message}
        title={messages.common.signIn}
      />
    );
  }

  const previewFallback = allowDemoContent() ? (
    <LearnPreview mode="preview" demoLessons={demoLessons} messages={messages} />
  ) : (
    <StateCard
      action={<Link className="font-black text-crystal" href="/auth?next=/learn">{messages.common.signIn}</Link>}
      description={messages.learnPage.signInProgressDesc}
      title={messages.learnPage.signInProgress}
    />
  );

  return withSupabaseFallback(async () => {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile) {
    return (
      <StateCard
        action={<Link className="font-black text-crystal" href="/auth?next=/learn">{messages.common.signIn}</Link>}
        description={messages.learnPage.signInProgressDesc}
        title={messages.learnPage.signInProgress}
      />
    );
  }

  if (profile.role === "teacher") {
    const messages = await getServerMessages();
    const l = messages.dashboard.learn;
    const t = messages.dashboard.teacher;
    return (
      <StateCard
        title={l.teacherTitle}
        description={l.teacherDesc}
        action={
          <Link className="font-black text-crystal" href="/teacher">
            {t.studio}
          </Link>
        }
      />
    );
  }

  if (profile.role === "student") {
    const l = messages.learnPage;
    const d = messages.dashboard;
    const [quizzes, feed] = await Promise.all([
      getMatchedQuizzes(supabase),
      getPersonalizedFeed(supabase, profile.id),
    ]);
    const videos = feed.filter((post) => Boolean(post.media_url));

    return (
      <div className="space-y-5">
        <LearnQuestHero
          messages={messages}
          mode="student"
          points={profile.total_points}
          quizCount={quizzes.length}
          videoCount={videos.length}
        />

        <section className="-mx-4 bg-white px-4 py-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-crystal">
                {l.balance}
              </p>
              <h3 className="mt-2 text-4xl font-black text-night">{profile.total_points}</h3>
              <p className="text-xs font-bold text-slate-500">{l.zigoPoints}</p>
            </div>
            <Link className="tap-scale zigo-cta tap-scale rounded-lg px-4 py-3 text-sm font-black text-white" href="/store">
              {d.student.store}
            </Link>
          </div>
        </section>

        <LearnRewardPath messages={messages} points={profile.total_points} />

        <LearnHubSummary
          messages={messages}
          points={profile.total_points}
          quizCount={quizzes.length}
          videoCount={videos.length}
        />

        <DailyMissionsCard />

        <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Link className="tap-scale rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 p-4 text-center text-white" href="/focus">
            <p className="text-lg font-black">{messages.dock.focus}</p>
            <p className="mt-1 text-xs font-bold text-white/75">{l.pomodoroShort}</p>
          </Link>
          <Link className="tap-scale rounded-lg bg-white p-4 text-center" href="/micro">
            <p className="text-lg font-black text-night">{messages.nav.micro}</p>
            <p className="mt-1 text-xs font-bold text-slate-500">{l.watchClaim}</p>
          </Link>
          <Link className="tap-scale rounded-lg bg-gradient-to-br from-crystal to-berry p-4 text-center text-white" href="/duels">
            <p className="text-lg font-black">{d.student.duels}</p>
            <p className="mt-1 text-xs font-bold text-white/75">{l.safeRaces}</p>
          </Link>
          <Link className="tap-scale rounded-lg bg-white p-4 text-center" href="/store">
            <p className="text-lg font-black text-night">{d.student.store}</p>
            <p className="mt-1 text-xs font-bold text-slate-500">{l.spendRewards}</p>
          </Link>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-black text-night">{l.miniQuizzes}</h3>
          {quizzes.length === 0 ? (
            <StateCard title={l.noQuizzes} description={l.noQuizzesDesc} action={<Link className="font-black text-crystal" href="/onboarding">{messages.common.updateAreas}</Link>} />
          ) : (
            quizzes.map((quiz) => <LearnQuizCard key={quiz.id} quiz={quiz} />)
          )}
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-black text-night">{l.microVideos}</h3>
          {videos.length === 0 ? (
            <StateCard title={l.noVideos} description={l.noVideosDesc} action={<Link className="font-black text-crystal" href="/micro">{l.openMicro}</Link>} />
          ) : (
            videos.map((post) => <LearnVideoCard key={post.id} post={post} />)
          )}
        </section>
      </div>
    );
  }

  const children = await getChildProfiles(supabase);
  const l = messages.learnPage;

  if (children.length === 0) {
    return (
      <StateCard
        title={l.createChildFirst}
        description={l.createChildDesc}
        action={
          <Link className="font-black text-crystal" href="/family">
            {l.familyDashboard}
          </Link>
        }
      />
    );
  }

  const childLearning = await Promise.all(
    children.map(async (child) => ({
      child,
      quizzes: await getChildMatchedQuizzes(supabase, child.id),
      videos: (await getChildPersonalizedFeed(supabase, child.id)).filter((post) =>
        Boolean(post.media_url),
      ),
    })),
  );

  return (
    <div className="space-y-5">
      <section className="-mx-4 border-b border-slate-100 bg-white px-4 pb-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{l.parentManaged}</p>
        <h2 className="mt-1 text-2xl font-black text-night">{l.learnWithChild}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{l.parentLearnDesc}</p>
      </section>

      <DailyMissionsCard />

      {childLearning.map(({ child, quizzes, videos }) => (
        <section className="-mx-4 space-y-4 bg-white px-4 py-5" key={child.id}>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-crystal">
                {child.age_group ?? l.childProfileLabel}
              </p>
              <h3 className="mt-2 text-2xl font-black text-night">{child.display_name}</h3>
            </div>
            <span className="rounded-lg bg-violet-100 px-4 py-2 text-sm font-black text-crystal">
              {child.total_points} Zigo
            </span>
          </div>

          {quizzes.map((quiz) => (
            <LearnQuizCard childProfileId={child.id} key={quiz.id} quiz={quiz} />
          ))}
          {videos.map((post) => (
            <LearnVideoCard childProfileId={child.id} key={post.id} post={post} />
          ))}
          {quizzes.length === 0 && videos.length === 0 ? (
            <StateCard title={l.noContent} description={l.noContentDesc} />
          ) : null}
        </section>
      ))}
    </div>
  );
  }, previewFallback);
}

function LearnPreview({
  mode,
  demoLessons,
  messages,
}: {
  mode: "preview" | "signed-out";
  demoLessons: ReturnType<typeof buildDemoLessons>;
  messages: Awaited<ReturnType<typeof getServerMessages>>;
}) {
  const l = messages.dashboard.student;
  return (
    <div className="space-y-6">
      <LearnQuestHero
        messages={messages}
        mode={mode}
        points={340}
        quizCount={demoLessons.filter((lesson) => lesson.reward === "+10").length}
        videoCount={demoLessons.length}
      />

      {mode === "signed-out" ? (
        <StateCard
          title={l.signInTitle}
          description={l.signInDesc}
          action={
            <Link className="font-black text-crystal" href="/auth">
              {messages.common.signIn}
            </Link>
          }
        />
      ) : null}

      <DailyMissionsCard />

      <LearnRewardPath messages={messages} points={340} />

      <LearnHubSummary
        messages={messages}
        points={340}
        quizCount={demoLessons.filter((lesson) => lesson.reward === "+10").length}
        videoCount={demoLessons.length}
      />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-night">{messages.learnUi.todayStack}</h3>
          <span className="rounded-lg bg-mint px-3 py-1 text-xs font-black text-night">
            {messages.learnUi.safe}
          </span>
        </div>
        {demoLessons.map((lesson) => (
          <article className="-mx-4 grid grid-cols-[5rem_1fr_auto] items-center gap-3 border-b border-slate-100 bg-white px-4 py-3" key={lesson.title}>
            <div
              className={`flex aspect-square items-center justify-center rounded-lg bg-gradient-to-br ${lesson.color} text-xs font-black uppercase tracking-[0.12em] text-white`}
            >
              {messages.learnUi.postLabel}
            </div>
            <div>
              <p className="text-sm font-black text-night">{lesson.title}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">{lesson.area}</p>
            </div>
            <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-black text-night">
              {lesson.reward}
            </span>
          </article>
        ))}
      </section>
    </div>
  );
}

function LearnQuestHero({
  messages,
  mode,
  points,
  quizCount,
  videoCount,
}: {
  messages: Awaited<ReturnType<typeof getServerMessages>>;
  mode: "preview" | "signed-out" | "student";
  points: number;
  quizCount: number;
  videoCount: number;
}) {
  const lp = messages.learnPage;
  const nav = messages.nav;
  const d = messages.dashboard.student;

  return (
    <section className="-mx-4 overflow-hidden border-b border-violet-100 bg-white">
      <div className="bg-gradient-to-br from-night via-violet-900 to-crystal px-4 py-6 text-white">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-white/60">{lp.dailyQuest}</p>
        <h2 className="mt-2 text-3xl font-black leading-tight">
          {mode === "student" ? lp.streakAlive : lp.microEnergy}
        </h2>
        <p className="mt-2 text-sm font-bold leading-6 text-white/75">
          {lp.questDesc}
        </p>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <QuestStat label={lp.questStatPoints} value={points} />
          <QuestStat label={lp.questStatQuizzes} value={quizCount} />
          <QuestStat label={lp.questStatMicro} value={videoCount} />
        </div>
      </div>
      <div className="zigo-action-grid px-4 py-3 text-center font-black">
        <Link className="zigo-action-chip zigo-quick-action-primary tap-scale rounded-xl text-white" href="/micro">
          {nav.micro}
        </Link>
        <Link className="zigo-action-chip zigo-quick-action-secondary tap-scale rounded-xl text-violet-700" href="/learn">
          {messages.dock.learn}
        </Link>
        <Link className="zigo-action-chip zigo-quick-action-secondary tap-scale rounded-xl border border-cyan-100 bg-cyan-50 !text-cyan-700" href="/duels">
          {d.duels}
        </Link>
      </div>
    </section>
  );
}

function QuestStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="zigo-stat-chip rounded-xl bg-white/14 px-2 py-2 backdrop-blur">
      <p className="text-lg font-black">{value}</p>
      <p className="zigo-fit-text mt-0.5 text-[0.65rem] font-black uppercase tracking-[0.08em] text-white/75">{label}</p>
    </div>
  );
}

function LearnRewardPath({
  messages,
  points,
}: {
  messages: Awaited<ReturnType<typeof getServerMessages>>;
  points: number;
}) {
  const lp = messages.learnPage;
  const path = [
    { label: lp.pathWatch, meta: "+10", done: points >= 10 },
    { label: lp.pathQuiz, meta: "+10", done: points >= 20 },
    { label: lp.pathDuel, meta: "+25", done: points >= 45 },
    { label: lp.pathKumbara, meta: lp.pathShop, done: points >= 100 },
  ];

  return (
    <section className="-mx-4 border-y border-pink-100 bg-white px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">{messages.learnUi.rewardPath}</p>
          <h2 className="mt-1 text-xl font-black text-night">{lp.earnStreakUnlock}</h2>
        </div>
        <Link className="zigo-compact-pill tap-scale zigo-cta rounded-lg text-white" href="/store">
          {messages.dashboard.student.store}
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {path.map((step, index) => (
          <div className="text-center" key={step.label}>
            <div className={`mx-auto flex size-12 items-center justify-center rounded-2xl text-sm font-black ${
              step.done ? "bg-gradient-to-br from-crystal to-berry text-white" : "bg-violet-50 text-crystal"
            }`}>
              {index + 1}
            </div>
            <p className="mt-2 text-xs font-black leading-tight text-night">{step.label}</p>
            <p className="mt-0.5 text-[0.65rem] font-bold leading-tight text-slate-500">{step.meta}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function LearnHubSummary({
  messages,
  points,
  quizCount,
  videoCount,
}: {
  messages: Awaited<ReturnType<typeof getServerMessages>>;
  points: number;
  quizCount: number;
  videoCount: number;
}) {
  const lp = messages.learnPage;
  const nav = messages.nav;
  const d = messages.dashboard.student;
  const segments = [
    { href: "/micro", label: nav.micro, value: videoCount, tone: "from-crystal to-berry" },
    { href: "/learn", label: lp.hubQuizzes, value: quizCount, tone: "from-aqua to-mint" },
    { href: "/duels", label: d.duels, value: "+25", tone: "from-sun to-peach" },
  ];

  return (
    <section className="-mx-4 border-y border-violet-100 bg-gradient-to-r from-violet-50 via-pink-50 to-cyan-50 px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">{messages.learnUi.questHub}</p>
          <h2 className="mt-1 text-xl font-black text-night">{lp.hubSubtitle}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            {lp.pointsReady.replace("{points}", points.toLocaleString())}
          </p>
        </div>
        <Link className="tap-scale zigo-cta tap-scale rounded-lg px-4 py-3 text-xs font-black text-white" href="/student">
          {messages.profilesPage.chipProgress}
        </Link>
      </div>
      <div className="zigo-action-grid mt-4">
        {segments.map((segment) => (
          <Link
            className={`zigo-action-chip tap-scale rounded-lg bg-gradient-to-br ${segment.tone} text-white`}
            href={segment.href}
            key={segment.label}
          >
            <span className="block text-lg font-black">{segment.value}</span>
            <span className="mt-1 block text-[0.7rem] font-black leading-tight text-white/85">{segment.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
