import Link from "next/link";

import { GamifiedChildAvatar } from "@/features/booking/components/gamified-child-avatar";
import { ParentEcosystemHub } from "@/features/booking/components/parent-ecosystem-hub";
import { ChildActivityTimeline } from "@/components/child-activity-timeline";
import { GradeLevelForm } from "@/components/grade-level-form";
import { LessonRequestsPanel } from "@/components/lesson-requests-panel";
import { ParentApprovalQueue } from "@/components/parent-approval-queue";
import { ParentChildrenFocusCard } from "@/components/parent-children-focus-card";
import { ParentFocusOverviewCard } from "@/components/parent-focus-overview-card";
import { SocialAvatar, SocialPill } from "@/components/social-primitives";
import { StateCard } from "@/components/state-card";
import { ParentDevelopmentDashboard } from "@/features/dashboard/components/parent-development-dashboard";
import {
  getParentDevelopmentDashboardData,
  type ParentDevelopmentDashboardData,
} from "@/features/dashboard/services/development-dashboard.service";
import { RecommendedTeachersPanel } from "@/features/matching/components/recommended-teachers-panel";
import { WhatsAppSupportCard } from "@/components/whatsapp-support-card";
import { ZigoPlusPlansSection } from "@/components/zigo-plus-plans-section";
import { hasSupabaseEnv, withSupabaseFallback } from "@/lib/config";
import { canUseDevBillingBypass } from "@/lib/domain/billing";
import { getChildProfiles } from "@/lib/domain/children";
import { getParentChildrenFocusStats, getParentFocusOverview } from "@/lib/domain/focus-analytics";
import { getParentWeeklyProgressSummary } from "@/lib/domain/ecosystem/reporting";
import { getChildActivity } from "@/lib/domain/parent-dashboard";
import { getCurrentProfile, getEducationAreas, getUserInterestAreaIds, parseOrganizationType } from "@/lib/domain/profiles";
import { getPendingParentRedemptions } from "@/lib/domain/store";
import { getUserSubscription } from "@/lib/domain/subscription";
import { resolveProfilePlanGroups } from "@/lib/domain/subscription-plans";
import { getServerMessages } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import type { AvatarAssets } from "@/lib/supabase/database.types";

type ParentDashboardChild = {
  id: string;
  name: string;
  points: number;
  age: string;
  avatarAssets: AvatarAssets | null;
};

const previewChildren: ParentDashboardChild[] = [
  { id: "demo-child-1", name: "Ada", points: 340, age: "8-10", avatarAssets: null },
  { id: "demo-child-2", name: "Mert", points: 220, age: "11-13", avatarAssets: null },
];

export default async function ParentPage() {
  const messages = await getServerMessages();
  const { children, mode, pendingApprovals, focusOverview, childrenFocusStats, isPremium, allowDevActivate, childActivityById, gradeLevel, planGroups, profileId, parentAreas, developmentDashboard } =
    await getParentData();
  const d = messages.dashboard;
  const pp = messages.parentPage;

  return (
    <div className="space-y-4 pb-3">
      <section className="-mx-4 border-b border-pink-100 bg-white px-4 pb-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{d.parent.mode}</p>
        <h1 className="zigo-display mt-1 font-black leading-tight text-night">{d.parent.title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">{d.parent.desc}</p>
        <Link className="tap-scale mt-3 inline-flex rounded-lg bg-gradient-to-r from-crystal to-berry px-4 py-2 text-xs font-black text-white" href="/">
          {d.backToFeed}
        </Link>
      </section>

      {mode === "parent" || mode === "preview" ? (
        <ParentFocusOverviewCard overview={focusOverview} showPreview={mode === "preview"} />
      ) : null}

      {mode === "parent" || mode === "preview" ? (
        <ParentChildrenFocusCard showPreview={mode === "preview"} stats={childrenFocusStats} />
      ) : null}

      {mode === "parent" ? (
        <ParentDevelopmentDashboard
          data={developmentDashboard}
          labels={{
            eyebrow: messages.ecosystem.developmentEyebrow,
            title: messages.ecosystem.developmentTitle,
            weekly: {
              eyebrow: messages.ecosystem.weeklyEyebrow,
              title: messages.ecosystem.weeklyTitle,
              reports: messages.ecosystem.weeklyReports,
              average: messages.ecosystem.weeklyAverage,
              topArea: messages.ecosystem.weeklyTopArea,
              bookings: messages.ecosystem.weeklyBookings,
              empty: messages.ecosystem.weeklyEmpty,
            },
            topicSuccess: {
              title: messages.ecosystem.topicSuccessTitle,
              empty: messages.ecosystem.topicSuccessEmpty,
              successLabel: messages.ecosystem.topicSuccessLabel,
            },
            growth: {
              title: messages.ecosystem.growthTitle,
              empty: messages.ecosystem.growthEmpty,
              scoreLabel: messages.ecosystem.growthScoreLabel,
            },
            upcoming: {
              title: messages.ecosystem.upcomingTitle,
              empty: messages.ecosystem.upcomingEmpty,
              withTeacher: messages.ecosystem.upcomingWithTeacher,
              agendaLabel: messages.ecosystem.agendaViewLabel,
              joinLesson: messages.liveLessons.joinLesson,
              startLesson: messages.liveLessons.startLesson,
              notYet: messages.liveLessons.notYet,
              completed: messages.liveLessons.completed,
            },
          }}
        />
      ) : null}

      {mode === "parent" ? (
        <section className="-mx-4 border-y border-amber-100 bg-amber-50 px-4 py-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
            {messages.lessonPackages.eyebrow}
          </p>
          <h2 className="mt-2 text-lg font-black text-night">{messages.lessonPackages.title}</h2>
          <p className="mt-2 text-sm font-semibold text-amber-900">{messages.lessonPackages.desc}</p>
          <Link className="zigo-mobile-cta tap-scale mt-4 inline-flex rounded-2xl px-5 py-3" href="/parent/packages">
            {messages.lessonPackages.buyPackage}
          </Link>
        </section>
      ) : null}

      {mode === "parent" && children.length > 0 ? (
        <RecommendedTeachersPanel
          childrenOptions={children.map((child) => ({ id: child.id, name: child.name }))}
          labels={{
            eyebrow: messages.ecosystem.recommendedEyebrow,
            title: messages.ecosystem.recommendedTitle,
            desc: messages.ecosystem.recommendedDesc,
            weaknessPrefix: messages.ecosystem.recommendedWeakness,
            reputation: messages.ecosystem.reputation,
            empty: messages.ecosystem.recommendedEmpty,
            requestLesson: messages.ecosystem.recommendedRequestLesson,
            analyzing: messages.ecosystem.recommendedAnalyzing,
            childLabel: messages.ecosystem.recommendedChildLabel,
          }}
          role="parent"
        />
      ) : null}

      {mode === "parent" ? (
        <GradeLevelForm
          description={pp.gradeDesc}
          initialGradeLevel={gradeLevel}
          title={pp.gradeTitle}
        />
      ) : null}

      <section className="-mx-4 divide-y divide-slate-100 bg-white">
        {mode === "signed-out" ? (
          <StateCard
            title={d.parent.signInTitle}
            description={d.parent.signInDesc}
            action={
              <Link className="font-black text-crystal" href="/auth?next=/parent">
                {d.signIn}
              </Link>
            }
          />
        ) : mode === "role-preview" ? (
          <StateCard
            title={d.parent.parentRequired}
            description={d.parent.parentRequiredDesc}
            action={
              <Link className="font-black text-crystal" href="/profiles">
                {d.switchMode}
              </Link>
            }
          />
        ) : children.length === 0 ? (
          <StateCard
            title={d.parent.noChildren}
            description={d.parent.noChildrenDesc}
            action={
              <Link className="font-black text-crystal" href="/family">
                {d.parent.openFamily}
              </Link>
            }
          />
        ) : (
          children.map((child) => (
            <article className="px-4 py-4" key={child.id}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <GamifiedChildAvatar
                    avatarAssets={child.avatarAssets}
                    badgeLabel={d.parent.liveLessonStarBadge}
                    label={child.name}
                    showBadgeLabel={Boolean(child.avatarAssets && (child.avatarAssets.frame === "lesson_star" || child.avatarAssets.achievement_live_lesson))}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-500">{child.age}</p>
                    <h2 className="mt-0.5 text-lg font-black text-night">{child.name}</h2>
                  </div>
                </div>
                <SocialPill tone="primary">{child.points} {messages.common.points}</SocialPill>
              </div>
              <div className="mt-4 h-2 rounded-lg bg-slate-100">
                <div className="h-full rounded-lg bg-gradient-to-r from-crystal via-berry to-aqua" style={{ width: `${Math.min(100, Math.max(18, child.points / 5))}%` }} />
              </div>
              {mode === "parent" ? (
                <div className="mt-4">
                  <ChildActivityTimeline
                    activity={childActivityById[child.id] ?? []}
                    labels={{
                      title: d.parent.activityTitle,
                      empty: d.parent.activityEmpty,
                      points: d.parent.activityPoints,
                      quizScore: d.parent.activityQuizScore,
                      types: {
                        quiz_complete: d.parent.activityTypeQuiz,
                        micro_video_watched: d.parent.activityTypeVideo,
                        mini_quiz_completed: d.parent.activityTypeMiniQuiz,
                        duel_won: d.parent.activityTypeDuel,
                        lesson_completed: d.parent.activityTypeLesson,
                      },
                    }}
                  />
                </div>
              ) : null}
            </article>
          ))
        )}
      </section>

      {mode === "parent" ? (
        <ParentApprovalQueue
          items={pendingApprovals.map((item) => ({
            id: item.id,
            points_spent: item.points_spent,
            product: normalizeRelation(item.product),
            child: normalizeRelation(item.child),
          }))}
        />
      ) : null}

      {mode === "parent" && profileId ? (
        <>
          <div className="-mx-4 flex items-center justify-between bg-white px-4 pb-2">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
              {messages.lessonRequests.myRequestsTitle}
            </p>
            <Link className="text-xs font-black text-crystal" href="/parent/requests">
              {messages.lessonRequests.myRequestsCta} →
            </Link>
          </div>
          <LessonRequestsPanel
            childrenOptions={children.map((child) => ({ id: child.id, name: child.name }))}
            redirectOnCreate="/parent/requests?sent=1"
            role="parent"
            viewerId={profileId}
          />
        </>
      ) : null}

      {mode === "parent" && children.length > 0 ? (
        <ParentEcosystemHub
          areaOptions={parentAreas}
          childrenOptions={children.map((child) => ({ id: child.id, name: child.name }))}
          labels={{
            eyebrow: messages.ecosystem.hubEyebrow,
            matchingTitle: messages.ecosystem.matchingTitle,
            matchingDesc: messages.ecosystem.matchingDesc,
            weakness: messages.ecosystem.weakness,
            findTeachers: messages.ecosystem.findTeachers,
            noMatches: messages.ecosystem.noMatches,
            bookTitle: messages.ecosystem.bookTitle,
            bookDesc: messages.ecosystem.bookDesc,
            chooseTeacher: messages.lessonRequests.chooseTeacher,
            chooseChild: messages.lessonRequests.chooseChild,
            loadSlots: messages.ecosystem.loadSlots,
            noOpenSlots: messages.ecosystem.noOpenSlots,
            bookSlot: messages.ecosystem.bookSlot,
            bookingDone: messages.ecosystem.bookingDone,
            saveNeed: messages.ecosystem.saveNeed,
            reputation: messages.ecosystem.reputation,
            areaLabel: messages.ecosystem.areaLabel,
            myBookingsTitle: messages.ecosystem.bookingsTitle,
            myBookingsDesc: messages.ecosystem.parentBookingsDesc,
            bookingsEmpty: messages.ecosystem.bookingsEmpty,
            cancelBooking: messages.ecosystem.cancelBooking,
            cancelBookingConfirm: messages.ecosystem.cancelBookingConfirm,
            bookingCancelled: messages.ecosystem.bookingCancelled,
            statusBooked: messages.ecosystem.statusBooked,
            statusCompleted: messages.ecosystem.statusCompleted,
            statusCancelled: messages.ecosystem.statusCancelled,
          }}
        />
      ) : null}

      <section className="-mx-4 bg-gradient-to-r from-violet-50 via-pink-50 to-cyan-50 px-4 py-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">{pp.rewardApprovals}</p>
        <h2 className="mt-2 text-xl font-black text-night">{pp.rewardApprovalsTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {pp.rewardApprovalsDesc}
        </p>
        <Link className="tap-scale mt-4 inline-flex zigo-cta tap-scale rounded-lg px-4 py-3 text-sm font-black text-white" href="/store">
          {pp.reviewStoreRequests}
        </Link>
      </section>

      <section className="zigo-dashboard-grid">
        <DashboardLink accent="from-crystal to-berry" href="/family" label={pp.family} text={pp.childrenAreas} />
        <DashboardLink accent="from-sun to-peach" href="/moderation" label={pp.safety} text={pp.queueReports} />
        <DashboardLink accent="from-aqua to-mint" href="/questions" label={messages.nav.ask} text={pp.askTeachers} />
        <DashboardLink accent="from-berry to-peach" href="/store" label={pp.approvals} text={pp.rewardRequests} />
      </section>

      {mode === "parent" || mode === "preview" ? (
        <ZigoPlusPlansSection
          allowDevActivate={allowDevActivate}
          groups={planGroups}
          isPremium={isPremium}
        />
      ) : null}

      {mode === "parent" ? (
        <WhatsAppSupportCard
          buttonLabel={messages.support.button}
          context="parent"
          description={messages.support.description}
          eyebrow={messages.support.eyebrow}
          hoursLabel={messages.support.hours}
          prefilledMessage={messages.support.messageParent}
          privacyNote={messages.support.privacyNote}
          role="parent"
          title={messages.support.title}
        />
      ) : null}
    </div>
  );
}

async function getParentData(): Promise<{
  children: ParentDashboardChild[];
  mode: "parent" | "preview" | "role-preview" | "signed-out";
  pendingApprovals: Awaited<ReturnType<typeof getPendingParentRedemptions>>;
  focusOverview: Awaited<ReturnType<typeof getParentFocusOverview>>;
  childrenFocusStats: Awaited<ReturnType<typeof getParentChildrenFocusStats>>;
  isPremium: boolean;
  allowDevActivate: boolean;
  childActivityById: Record<string, Awaited<ReturnType<typeof getChildActivity>>>;
  gradeLevel: string | null;
  planGroups: ReturnType<typeof resolveProfilePlanGroups>;
  profileId: string | null;
  weeklyProgress: Awaited<ReturnType<typeof getParentWeeklyProgressSummary>>;
  parentAreas: Array<{ id: number; name: string }>;
  developmentDashboard: ParentDevelopmentDashboardData;
}> {
  const m = await getServerMessages();
  const previewOverview = {
    matchedStudyMoments: 6,
    focusMinutesInAreas: 150,
    latestTopic: m.studyWithMeRail.demoTopicFractions,
    latestStudentName: "Elif",
    latestCreatedAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
  };

  const emptyWeekly = {
    reportCount: 0,
    averageScore: 0,
    topArea: null,
    completedBookings: 0,
  };

  const emptyDevelopmentDashboard: ParentDevelopmentDashboardData = {
    weeklyProgress: emptyWeekly,
    topicSuccess: [],
    growthCurve: [],
    upcomingLessons: [],
  };

  if (!hasSupabaseEnv()) {
    return {
      children: previewChildren,
      mode: "preview",
      pendingApprovals: [],
      focusOverview: previewOverview,
      childrenFocusStats: [],
      isPremium: false,
      allowDevActivate: canUseDevBillingBypass(),
      childActivityById: {},
      gradeLevel: null,
      planGroups: resolveProfilePlanGroups("parent", previewChildren.length > 0),
      profileId: null,
      weeklyProgress: emptyWeekly,
      parentAreas: [],
      developmentDashboard: emptyDevelopmentDashboard,
    };
  }

  const previewFallback: Awaited<ReturnType<typeof getParentData>> = {
    children: previewChildren,
    mode: "preview" as const,
    pendingApprovals: [] as Awaited<ReturnType<typeof getPendingParentRedemptions>>,
    focusOverview: previewOverview,
    childrenFocusStats: [] as Awaited<ReturnType<typeof getParentChildrenFocusStats>>,
    isPremium: false,
    allowDevActivate: canUseDevBillingBypass(),
    childActivityById: {} as Record<string, Awaited<ReturnType<typeof getChildActivity>>>,
    gradeLevel: null as string | null,
    planGroups: resolveProfilePlanGroups("parent", previewChildren.length > 0),
    profileId: null,
    weeklyProgress: emptyWeekly,
    parentAreas: [],
    developmentDashboard: emptyDevelopmentDashboard,
  };

  return withSupabaseFallback(async () => {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) {
    return {
      children: [],
      mode: "signed-out",
      pendingApprovals: [],
      focusOverview: previewOverview,
      childrenFocusStats: [],
      isPremium: false,
      allowDevActivate: false,
      childActivityById: {},
      gradeLevel: null,
      planGroups: [],
      profileId: null,
      weeklyProgress: emptyWeekly,
      parentAreas: [],
      developmentDashboard: emptyDevelopmentDashboard,
    };
  }
  if (profile.role !== "parent") {
    return {
      children: [],
      mode: "role-preview",
      pendingApprovals: [],
      focusOverview: previewOverview,
      childrenFocusStats: [],
      isPremium: false,
      allowDevActivate: false,
      childActivityById: {},
      gradeLevel: null,
      planGroups: [],
      profileId: profile.id,
      weeklyProgress: emptyWeekly,
      parentAreas: [],
      developmentDashboard: emptyDevelopmentDashboard,
    };
  }

  const [children, pendingApprovals, focusOverview, childrenFocusStats, subscription, weeklyProgress, allAreas, parentAreaIds, developmentDashboard] =
    await Promise.all([
    getChildProfiles(supabase),
    getPendingParentRedemptions(supabase),
    getParentFocusOverview(supabase),
    getParentChildrenFocusStats(supabase),
    getUserSubscription(supabase, profile.id),
    getParentWeeklyProgressSummary(supabase, profile.id),
    getEducationAreas(supabase),
    getUserInterestAreaIds(supabase, profile.id),
    getParentDevelopmentDashboardData(supabase, profile.id),
  ]);

  const activityEntries = await Promise.all(
    children.map(async (child) => [child.id, await getChildActivity(supabase, child.id, 8)] as const),
  );

  return {
    children: children.map((child) => ({
      id: child.id,
      name: child.display_name,
      points: child.total_points,
      age: child.age_group ?? m.common.childProfile,
      avatarAssets: child.avatar_assets,
    })),
    mode: "parent",
    pendingApprovals,
    focusOverview,
    childrenFocusStats,
    isPremium: subscription.isPremium,
    allowDevActivate: canUseDevBillingBypass(),
    childActivityById: Object.fromEntries(activityEntries),
    gradeLevel: profile.grade_level,
    planGroups: resolveProfilePlanGroups("parent", children.length > 0, parseOrganizationType(profile.organization_type)),
    profileId: profile.id,
    weeklyProgress,
    parentAreas: allAreas
      .filter((area) => parentAreaIds.includes(area.id))
      .map((area) => ({ id: area.id, name: area.area_name })),
    developmentDashboard,
  };
  }, previewFallback);
}

function DashboardLink({ accent, href, label, text }: { accent: string; href: string; label: string; text: string }) {
  return (
    <Link className={`tap-scale zigo-mobile-card rounded-2xl bg-gradient-to-br ${accent} text-white`} href={href}>
      <p className="text-lg font-black">{label}</p>
      <p className="mt-1 text-xs font-bold text-white/80">{text}</p>
    </Link>
  );
}

function normalizeRelation<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}
