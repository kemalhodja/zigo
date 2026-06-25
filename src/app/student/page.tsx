import Link from "next/link";

import { DailyMissionsCard } from "@/components/daily-missions-card";
import { FocusAnalyticsCard } from "@/components/focus-analytics-card";
import { GradeLevelForm } from "@/components/grade-level-form";
import { LearningProgressCard } from "@/components/learning-progress-card";
import { RecentLearningCard } from "@/components/recent-learning-card";
import { StateCard } from "@/components/state-card";
import { ZigoPlusPlansSection } from "@/components/zigo-plus-plans-section";
import { hasSupabaseEnv, withSupabaseFallback } from "@/lib/config";
import { allowDemoContent } from "@/lib/domain/demo-env";
import { canUseDevBillingBypass } from "@/lib/domain/billing";
import { getStudentFocusAnalytics } from "@/lib/domain/focus-analytics";
import {
  getDailyMissionProgress,
  getLearningProgressStats,
  getRecentLearningHistory,
  type LearningHistoryItem,
  type LearningProgressStats,
} from "@/lib/domain/learning";
import { getCurrentProfile, parseOrganizationType } from "@/lib/domain/profiles";
import { buildStudentGamification, LEAGUE_PATH } from "@/lib/domain/student-gamification";
import { getUserSubscription } from "@/lib/domain/subscription";
import { resolveProfilePlanGroups } from "@/lib/domain/subscription-plans";
import { getServerMessages, type Messages } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

const fallbackStats: LearningProgressStats = {
  eventCount: 18,
  reelWatches: 9,
  quizCompletions: 6,
  duelWins: 3,
  focusSessions: 2,
  pointsFromEvents: 180,
};
const emptyStats: LearningProgressStats = {
  eventCount: 0,
  reelWatches: 0,
  quizCompletions: 0,
  duelWins: 0,
  focusSessions: 0,
  pointsFromEvents: 0,
};

export default async function StudentPage() {
  const data = await getStudentDashboardData();
  const gamification = buildStudentGamification(data.totalPoints);
  const m = await getServerMessages();
  const d = m.dashboard;
  const z = m.zigo;

  return (
    <div className="space-y-4 pb-3">
      <section className="-mx-4 border-b border-pink-100 bg-white px-4 pb-4">
        <p className="zigo-eyebrow text-slate-500">{d.student.mode}</p>
        <h1 className="zigo-display mt-1 font-black leading-tight text-night">{d.student.title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">{d.student.desc}</p>
        <Link className="tap-scale mt-3 inline-flex rounded-lg bg-gradient-to-r from-crystal via-berry to-aqua px-4 py-2 text-xs font-black text-white" href="/">
          {d.backToFeed}
        </Link>
      </section>

      {!data.isSignedOut && !data.showPreview ? (
        <GradeLevelForm initialGradeLevel={data.gradeLevel} />
      ) : null}

      <section className="grid grid-cols-2 gap-2">
        <DashboardLink accent="from-indigo-600 to-violet-600" href="/focus" label={z.focusMode} text={z.studyWithMe} />
        <DashboardLink accent="from-crystal to-berry" href="/micro" label={z.micro} text={d.student.watchEarn} />
        <DashboardLink accent="from-aqua to-mint" href="/learn" label={m.dock.learn} text={d.student.quizzes} />
        <DashboardLink accent="from-violet-600 to-fuchsia-500" href="/duels" label={d.student.duels} text={d.student.topicRaces} />
        <DashboardLink accent="from-sun to-peach" href="/store" label={d.student.store} text={d.student.spendPoints} />
        <DashboardLink accent="from-berry to-peach" href="/avatar" label={d.student.avatar} text={d.student.equipRewards} />
      </section>

      {data.isSignedOut ? (
        <StateCard
          title={d.student.signInTitle}
          description={d.student.signInDesc}
          action={
            <Link className="font-black text-crystal" href="/auth?next=/student">
              {d.signIn}
            </Link>
          }
        />
      ) : null}

      <LearningProgressCard
        duelWins={data.stats.duelWins}
        eventCount={data.stats.eventCount}
        gems={gamification.gems}
        isPreview={data.showPreview}
        level={gamification.level}
        leagueLabel={gamification.leagueLabel}
        levelProgress={gamification.levelProgress}
        points={gamification.points}
        pointsToNextLevel={gamification.pointsToNextLevel}
        quizCompletions={data.stats.quizCompletions}
        reelWatches={data.stats.reelWatches}
        focusSessions={data.stats.focusSessions}
      />

      <LeaguePathCard
        gamification={gamification}
        quizCompletions={data.stats.quizCompletions}
        streakDays={data.streakDays}
        labels={d.student}
      />

      {data.focusAnalytics ? <FocusAnalyticsCard analytics={data.focusAnalytics} messages={m} showPreview={data.showPreview} /> : null}

      <DailyMissionsCard />
      <RecentLearningCard history={data.history} showPreview={data.showPreview} />

      {!data.isSignedOut ? (
        <ZigoPlusPlansSection
          allowDevActivate={data.allowDevActivate}
          groups={data.planGroups}
          isPremium={data.isPremium}
        />
      ) : null}
    </div>
  );
}

async function getStudentDashboardData(): Promise<{
  history: LearningHistoryItem[];
  stats: LearningProgressStats;
  showPreview: boolean;
  isSignedOut: boolean;
  streakDays: number;
  totalPoints: number;
  focusAnalytics: Awaited<ReturnType<typeof getStudentFocusAnalytics>> | null;
  isPremium: boolean;
  allowDevActivate: boolean;
  gradeLevel: string | null;
  planGroups: ReturnType<typeof resolveProfilePlanGroups>;
}> {
  if (!hasSupabaseEnv()) {
    return allowDemoContent()
      ? {
          history: [],
          stats: fallbackStats,
          isSignedOut: false,
          showPreview: true,
          streakDays: 3,
          totalPoints: 240,
          focusAnalytics: {
            completedSessions: 4,
            focusMinutesWeek: 100,
            sharedMoments: 2,
            weeklyGoal: 5,
            weeklyCompleted: 4,
            pointsFromFocus: 60,
            activeSession: null,
          },
          isPremium: false,
          allowDevActivate: canUseDevBillingBypass(),
          gradeLevel: null,
          planGroups: resolveProfilePlanGroups("student"),
        }
      : {
          history: [],
          stats: emptyStats,
          isSignedOut: true,
          showPreview: false,
          streakDays: 0,
          totalPoints: 0,
          focusAnalytics: null,
          isPremium: false,
          allowDevActivate: false,
          gradeLevel: null,
          planGroups: [],
        };
  }

  const previewFallback: Awaited<ReturnType<typeof getStudentDashboardData>> = allowDemoContent()
    ? {
        history: [] as LearningHistoryItem[],
        stats: fallbackStats,
        isSignedOut: false,
        showPreview: true,
        streakDays: 3,
        totalPoints: 240,
        focusAnalytics: {
          completedSessions: 4,
          focusMinutesWeek: 100,
          sharedMoments: 2,
          weeklyGoal: 5,
          weeklyCompleted: 4,
          pointsFromFocus: 60,
          activeSession: null,
        },
        isPremium: false,
        allowDevActivate: canUseDevBillingBypass(),
        gradeLevel: null as string | null,
        planGroups: resolveProfilePlanGroups("student"),
      }
    : {
        history: [] as LearningHistoryItem[],
        stats: emptyStats,
        isSignedOut: true,
        showPreview: false,
        streakDays: 0,
        totalPoints: 0,
        focusAnalytics: null,
        isPremium: false,
        allowDevActivate: false,
        gradeLevel: null,
        planGroups: [],
      };

  return withSupabaseFallback(async () => {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) {
    return {
      history: [],
      stats: emptyStats,
      isSignedOut: true,
      showPreview: false,
      streakDays: 0,
      totalPoints: 0,
      focusAnalytics: null,
      isPremium: false,
      allowDevActivate: false,
      gradeLevel: null,
      planGroups: [],
    };
  }

  const [stats, history, missions, focusAnalytics, subscription] = await Promise.all([
    getLearningProgressStats(supabase, profile.id),
    getRecentLearningHistory(supabase, profile.id),
    profile.role === "student" ? getDailyMissionProgress(supabase, profile.id) : Promise.resolve({ streakDays: 0, completedIds: [], eventsToday: 0 }),
    profile.role === "student" ? getStudentFocusAnalytics(supabase) : Promise.resolve(null),
    profile.role === "student" ? getUserSubscription(supabase, profile.id) : Promise.resolve({ tier: "free" as const, isPremium: false }),
  ]);

  return {
    history,
    stats,
    isSignedOut: false,
    showPreview: false,
    streakDays: Math.max(0, missions.streakDays),
    totalPoints: profile.total_points,
    focusAnalytics,
    isPremium: subscription.isPremium,
    allowDevActivate: canUseDevBillingBypass(),
    gradeLevel: profile.grade_level,
    planGroups: resolveProfilePlanGroups("student", false, parseOrganizationType(profile.organization_type)),
  };
  }, previewFallback);
}

function LeaguePathCard({
  gamification,
  quizCompletions,
  streakDays,
  labels,
}: {
  gamification: ReturnType<typeof buildStudentGamification>;
  quizCompletions: number;
  streakDays: number;
  labels: Messages["dashboard"]["student"];
}) {
  return (
    <section className="-mx-4 space-y-4 bg-white px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="zigo-eyebrow text-crystal">{labels.leaguePath}</p>
          <h2 className="zigo-title-sm mt-1 font-black text-night">{gamification.leagueLabel}</h2>
          <p className="mt-1 text-sm font-bold leading-6 text-slate-500">
            {gamification.nextLeagueLabel
              ? `${gamification.pointsToNextLeague} ${labels.pointsToLeague} ${gamification.nextLeagueLabel}.`
              : labels.topLeague}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-500">{quizCompletions} {labels.quizzesCompleted}</p>
        </div>
        <span className="zigo-stat-chip shrink-0 rounded-lg bg-gradient-to-r from-sun to-peach px-4 py-3 text-center text-sm font-black text-night">
          {Math.max(streakDays, 0)}
          <span className="block text-[0.65rem] uppercase tracking-[0.08em]">{labels.dayStreak}</span>
        </span>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {LEAGUE_PATH.map((league) => {
          const isUnlocked = gamification.points >= league.min;
          return (
            <div
              className={`zigo-stat-chip rounded-lg px-2 py-3 text-center ${
                isUnlocked ? "bg-gradient-to-br from-crystal to-berry text-white" : "bg-slate-100 text-slate-400"
              }`}
              key={league.label}
            >
              <p className="text-xs font-black leading-tight">{league.label}</p>
              <p className={`mt-1 text-[0.65rem] font-black leading-tight ${isUnlocked ? "text-white/75" : "text-slate-400"}`}>
                {league.min}+
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function DashboardLink({ accent, href, label, text }: { accent: string; href: string; label: string; text: string }) {
  return (
    <Link className={`tap-scale rounded-lg bg-gradient-to-br ${accent} p-4 text-white`} href={href}>
      <p className="text-base font-black">{label}</p>
      <p className="zigo-fit-text mt-1 text-xs font-bold leading-snug text-white/78">{text}</p>
    </Link>
  );
}
