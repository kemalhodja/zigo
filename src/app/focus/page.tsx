import Link from "next/link";

import { DailyMissionsCard } from "@/components/daily-missions-card";
import { FocusAnalyticsCard } from "@/components/focus-analytics-card";
import { FocusPomodoroCard } from "@/components/focus-pomodoro-card";
import { StateCard } from "@/components/state-card";
import { StudyPlanCard } from "@/components/study-plan-card";
import { StudyWithMeRail } from "@/components/study-with-me-rail";
import { ZigoPlusUpsell } from "@/components/zigo-plus-upsell";
import { hasSupabaseEnv, withSupabaseFallback } from "@/lib/config";
import { canUseDevBillingBypass } from "@/lib/domain/billing";
import { getStudentFocusAnalytics } from "@/lib/domain/focus-analytics";
import { getCurrentProfile, getEducationAreas, getUserInterestAreaIds } from "@/lib/domain/profiles";
import { getMatchedStudyMoments } from "@/lib/domain/study-moments";
import { getUserSubscription } from "@/lib/domain/subscription";
import { getServerMessages } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

const previewAnalytics = {
  completedSessions: 4,
  focusMinutesWeek: 100,
  sharedMoments: 2,
  weeklyGoal: 5,
  weeklyCompleted: 4,
  pointsFromFocus: 60,
  activeSession: null,
};

export default async function FocusPage() {
  const m = await getServerMessages();

  const previewFallback = (
    <div className="space-y-4">
      <FocusPomodoroCard areas={[{ id: 1, area_name: "LGS Matematik" }]} />
      <FocusAnalyticsCard analytics={previewAnalytics} messages={m} showPreview />
      <StudyWithMeRail moments={[]} showPreview />
      <StudyPlanCard analytics={previewAnalytics} areas={[{ id: 1, area_name: "LGS Matematik" }]} isPremium={false} />
      <ZigoPlusUpsell allowDevActivate={canUseDevBillingBypass()} />
    </div>
  );

  if (!hasSupabaseEnv()) {
    return previewFallback;
  }

  return withSupabaseFallback(async () => {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile) {
    const f = (await getServerMessages()).dashboard;
    return (
      <StateCard
        title={f.focus.signInTitle}
        description={f.focus.signInDesc}
        action={
          <Link className="font-black text-crystal" href="/auth?next=/focus">
            {f.signIn}
          </Link>
        }
      />
    );
  }

  if (profile.role !== "student") {
    const fc = m.focusCard;
    return (
      <StateCard
        title={fc.studentOnlyTitle}
        description={fc.studentOnlyDesc}
        action={
          <Link className="font-black text-crystal" href={profile.role === "parent" ? "/parent" : "/teacher"}>
            {fc.goToDashboard}
          </Link>
        }
      />
    );
  }

  const [areaIds, allAreas, moments, subscription, analytics] = await Promise.all([
    getUserInterestAreaIds(supabase, profile.id),
    getEducationAreas(supabase),
    getMatchedStudyMoments(supabase),
    getUserSubscription(supabase, profile.id),
    getStudentFocusAnalytics(supabase),
  ]);

  const areas = allAreas.filter((area) => areaIds.includes(area.id));

  return (
    <div className="space-y-4 pb-3">
      <section className="-mx-4 border-b border-violet-100 bg-white px-4 pb-4">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">{m.focusCard.heroNiche}</p>
        <h1 className="mt-1 text-2xl font-black leading-tight text-night">{m.focusCard.heroTitle}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {m.focusCard.heroDesc}
        </p>
      </section>

      <FocusPomodoroCard areas={areas} isPremium={subscription.isPremium} />
      <FocusAnalyticsCard analytics={analytics} messages={m} />
      <StudyWithMeRail moments={moments} />
      <StudyPlanCard analytics={analytics} areas={areas} isPremium={subscription.isPremium} />
      {subscription.isPremium ? null : (
        <ZigoPlusUpsell allowDevActivate={canUseDevBillingBypass()} compact />
      )}
      <DailyMissionsCard />
    </div>
  );
  }, previewFallback);
}
