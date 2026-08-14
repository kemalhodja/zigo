import Link from "next/link";

import { HomeLearningPulse } from "@/app/_components/home/learning-pulse";
import { ClassGroupManager } from "@/components/class-group-manager";

import { GradeLevelForm } from "@/components/grade-level-form";
import { LearningProgressCard } from "@/components/learning-progress-card";
import { PushNotificationPrompt } from "@/components/PushNotificationPrompt";
import { RecentLearningCard } from "@/components/recent-learning-card";
import { StateCard } from "@/components/state-card";
import { StudentLeaderboardCard } from "@/components/student-leaderboard-card";
import { SubscribeButton } from "@/components/SubscribeButton";
import { ZigoPlusPlansSection } from "@/components/zigo-plus-plans-section";
import { hasSupabaseEnv, withSupabaseFallback } from "@/lib/config";
import { canUseDevBillingBypass } from "@/lib/domain/billing";
import { allowDemoContent } from "@/lib/domain/demo-env";

import {
  getDailyMissionProgress,
  getLearningProgressStats,
  getRecentLearningHistory,
  type LearningHistoryItem,
  type LearningProgressStats,
} from "@/lib/domain/learning";
import { getCurrentProfile, parseOrganizationType } from "@/lib/domain/profiles";
import { buildStudentGamification, LEAGUE_PATH } from "@/lib/domain/student-gamification";
import type { AreaLeaderboardEntry } from "@/lib/domain/student-leaderboard";
import {
  getAreaLeaderboard,
  getPrimaryInterestAreaId,
} from "@/lib/domain/student-leaderboard-service";
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
  const m = await getServerMessages();
  const d = m.dashboard;

  if (data.mode === "role-preview") {
    return (
      <div className="space-y-4 pb-3">
        <section className="-mx-4 border-b border-pink-100 bg-white px-4 pb-4">
          <p className="zigo-eyebrow text-slate-500">{d.student.mode}</p>
          <h1 className="zigo-display mt-1 font-black leading-tight text-night">{d.student.title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{d.student.desc}</p>
        </section>
        <StateCard
          action={
            <Link className="font-black text-crystal" href="/auth">
              {d.switchMode}
            </Link>
          }
          description={d.student.studentRequiredDesc}
          title={d.student.studentRequired}
        />
      </div>
    );
  }

  const gamification = buildStudentGamification(data.totalPoints);
  const z = m.zigo;

  return (
    <div className="space-y-4 pb-3">
      <section className="-mx-4 border-b border-pink-100 bg-white px-4 pb-4">
        <p className="zigo-eyebrow text-slate-500">{d.student.mode}</p>
        <h1 className="zigo-display mt-1 font-black leading-tight text-night">{d.student.title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">{d.student.desc}</p>
      </section>

      {!data.isSignedOut && !data.showPreview ? (
        <div className="space-y-3">
          <PushNotificationPrompt />
          <SubscribeButton />
          <GradeLevelForm initialGradeLevel={data.gradeLevel} />
          <ClassGroupManager
            isSubscriber={data.isPremium}
            initialCity={data.city}
            initialDistrict={data.district}
            initialSchoolName={data.schoolName}
            initialGradeLevel={data.gradeLevel}
            initialClassroom={null}
            userRole="student"
          />
        </div>
      ) : null}

      <div className="py-2">
        <HomeLearningPulse />
      </div>

      <section className="grid grid-cols-2 gap-2">
        <DashboardLink accent="from-crystal to-berry" href="/micro" label={z.micro} text={d.student.watchEarn} />
        <DashboardLink accent="from-aqua to-mint" href="/learn" label={m.dock.learn} text={d.student.quizzes} />
        <DashboardLink accent="from-sun to-peach" href="/store" label={d.student.store} text={d.student.spendPoints} />
        <DashboardLink accent="from-berry to-peach" href="/avatar" label={d.student.avatar} text={d.student.equipRewards} />
      </section>

      <div className="-mx-4 bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-4 my-2 sm:rounded-2xl sm:mx-0 shadow-lg relative overflow-hidden group">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2"><span>🧠</span> Zihin Avcısı</h3>
            <p className="text-indigo-100 text-xs font-bold mt-1">Görsel hafızanı test et, Zigo Puanı kazan!</p>
          </div>
          <Link href="/student/games/memory" className="tap-scale shrink-0 bg-white text-indigo-700 px-4 py-2.5 rounded-xl text-xs font-black shadow-sm hover:bg-indigo-50 transition-colors">
            Oyna
          </Link>
        </div>
        <div className="absolute top-0 right-0 -mr-6 -mt-6 text-white/10 text-8xl transform rotate-12 transition-transform group-hover:scale-110 pointer-events-none">
          🧠
        </div>
      </div>

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

      {data.leaderboardAreaName ? (
        <StudentLeaderboardCard
          areaName={data.leaderboardAreaName}
          empty="Bu alanda henüz sıralama yok. İlk puanı sen kazan."
          entries={data.leaderboard}
          title="Alan ligi"
          viewerId={data.viewerId}
        />
      ) : null}

      <RecentLearningCard history={data.history} showPreview={data.showPreview} />

      {!data.isSignedOut ? (
        <ZigoPlusPlansSection
          allowDevActivate={data.allowDevActivate}
          groups={data.planGroups}
          isPremium={data.isPremium}
          userCreatedAt={data.userCreatedAt}
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
  mode: "student" | "signed-out" | "role-preview" | "preview";
  streakDays: number;
  totalPoints: number;
  isPremium: boolean;
  allowDevActivate: boolean;
  gradeLevel: string | null;
  city: string | null;
  district: string | null;
  schoolName: string | null;
  planGroups: ReturnType<typeof resolveProfilePlanGroups>;
  leaderboard: AreaLeaderboardEntry[];
  leaderboardAreaName: string | null;
  viewerId: string | null;
  userCreatedAt: string | null;
}> {
  if (!hasSupabaseEnv()) {
    return allowDemoContent()
      ? {
          history: [],
          stats: fallbackStats,
          isSignedOut: false,
          showPreview: true,
          mode: "preview",
          streakDays: 3,
          totalPoints: 240,

          isPremium: false,
          allowDevActivate: canUseDevBillingBypass(),
          gradeLevel: null,
          city: null,
          district: null,
          schoolName: null,
          planGroups: resolveProfilePlanGroups("student"),
          leaderboard: [
            { userId: "demo-1", fullName: "Ada", totalPoints: 240, rank: 1 },
            { userId: "demo-2", fullName: "Bora", totalPoints: 180, rank: 2 },
          ],
          leaderboardAreaName: "LGS Matematik",
          viewerId: "demo-1",
          userCreatedAt: new Date().toISOString(),
        }
      : {
          history: [],
          stats: emptyStats,
          isSignedOut: true,
          showPreview: false,
          mode: "signed-out",
          streakDays: 0,
          totalPoints: 0,

          isPremium: false,
          allowDevActivate: false,
          gradeLevel: null,
          city: null,
          district: null,
          schoolName: null,
          planGroups: [],
          leaderboard: [],
          leaderboardAreaName: null,
          viewerId: null,
          userCreatedAt: null,
        };
  }

  const previewFallback: Awaited<ReturnType<typeof getStudentDashboardData>> = allowDemoContent()
    ? {
        history: [] as LearningHistoryItem[],
        stats: fallbackStats,
        isSignedOut: false,
        showPreview: true,
        mode: "preview",
        streakDays: 3,
        totalPoints: 240,

        isPremium: false,
        allowDevActivate: canUseDevBillingBypass(),
        gradeLevel: null as string | null,
        city: null as string | null,
        district: null as string | null,
        schoolName: null as string | null,
        planGroups: resolveProfilePlanGroups("student"),
        leaderboard: [
          { userId: "demo-1", fullName: "Ada", totalPoints: 240, rank: 1 },
          { userId: "demo-2", fullName: "Bora", totalPoints: 180, rank: 2 },
        ],
        leaderboardAreaName: "LGS Matematik",
        viewerId: "demo-1",
        userCreatedAt: new Date().toISOString(),
      }
    : {
        history: [] as LearningHistoryItem[],
        stats: emptyStats,
        isSignedOut: true,
        showPreview: false,
        mode: "signed-out",
        streakDays: 0,
        totalPoints: 0,

        isPremium: false,
        allowDevActivate: false,
        gradeLevel: null,
        city: null,
        district: null,
        schoolName: null,
        planGroups: [],
        leaderboard: [],
        leaderboardAreaName: null,
        viewerId: null,
        userCreatedAt: null,
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
      mode: "signed-out" as const,
      streakDays: 0,
      totalPoints: 0,

      isPremium: false,
      allowDevActivate: false,
      gradeLevel: null,
      city: null,
      district: null,
      schoolName: null,
      planGroups: [],
      leaderboard: [],
      leaderboardAreaName: null,
      viewerId: null,
      userCreatedAt: null,
    };
  }

  if (profile.role !== "student") {
    return {
      history: [],
      stats: emptyStats,
      isSignedOut: false,
      showPreview: false,
      mode: "role-preview" as const,
      streakDays: 0,
      totalPoints: 0,

      isPremium: false,
      allowDevActivate: false,
      gradeLevel: null,
      city: null,
      district: null,
      schoolName: null,
      planGroups: [],
      leaderboard: [],
      leaderboardAreaName: null,
      viewerId: profile.id,
      userCreatedAt: profile.created_at ?? null,
    };
  }

  const [stats, history, missions, subscription, areaId] = await Promise.all([
    getLearningProgressStats(supabase, profile.id),
    getRecentLearningHistory(supabase, profile.id),
    getDailyMissionProgress(supabase, profile.id),
    getUserSubscription(supabase, profile.id),
    getPrimaryInterestAreaId(supabase, profile.id),
  ]);

  let leaderboard: AreaLeaderboardEntry[] = [];
  let leaderboardAreaName: string | null = null;
  if (areaId) {
    const area = await supabase.from("education_areas").select("area_name").eq("id", areaId).maybeSingle();
    leaderboardAreaName = area.data?.area_name ?? null;
    try {
      leaderboard = await getAreaLeaderboard(supabase, areaId, 8);
    } catch {
      leaderboard = [];
    }
  }

  const profileLoc = profile as unknown as { city?: string | null; district?: string | null };
  return {
    history,
    stats,
    isSignedOut: false,
    showPreview: false,
    mode: "student" as const,
    streakDays: Math.max(0, (profile as unknown as { streak_days?: number }).streak_days ?? 0),
    totalPoints: profile.total_points,
    isPremium: subscription.isPremium,
    allowDevActivate: canUseDevBillingBypass(),
    gradeLevel: profile.grade_level,
    city: profileLoc.city ?? null,
    district: profileLoc.district ?? null,
    schoolName: profile.school_name,
    planGroups: resolveProfilePlanGroups("student", false, parseOrganizationType(profile.organization_type)),
    leaderboard,
    leaderboardAreaName,
    viewerId: profile.id,
    userCreatedAt: profile.created_at ?? null,
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
