import dynamic from "next/dynamic";
import Link from "next/link";

const ParentChart = dynamic(() => import("@/components/parent-chart").then((mod) => mod.ParentChart));
const ParentActivityBreakdown = dynamic(() => import("@/components/parent-activity-breakdown").then((mod) => mod.ParentActivityBreakdown));
import { StateCard } from "@/components/state-card";
import { MiniGamesArcadeSection } from "@/components/mini-games-arcade-section";
import { ZigoPlusPlansSection } from "@/components/zigo-plus-plans-section";
import { LimitSettingsCard } from "@/components/limit-settings-card";
import { PushNotificationPrompt } from "@/components/PushNotificationPrompt";
import { hasSupabaseEnv, withSupabaseFallback } from "@/lib/config";
import { canUseDevBillingBypass } from "@/lib/domain/billing";
import { getChildProfiles } from "@/lib/domain/children";

import { getChildActivity } from "@/lib/domain/parent-dashboard";
import { getCurrentProfile, parseOrganizationType } from "@/lib/domain/profiles";
import { getPendingParentRedemptions } from "@/lib/domain/store";
import { getUserSubscription } from "@/lib/domain/subscription";
import { resolveProfilePlanGroups } from "@/lib/domain/subscription-plans";
import { getServerMessages } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

const previewChildren = [
  { id: "demo-child-1", name: "Ada", points: 340, age: "8-10" },
  { id: "demo-child-2", name: "Mert", points: 220, age: "11-13" },
];

export default async function ParentPage() {
  const messages = await getServerMessages();
  const { mode, isPremium, allowDevActivate, planGroups, children, childActivityById, userCreatedAt } =
    await getParentData();
  const d = messages.dashboard;

  // Generate chart data based on childActivityById for all children combined (or per child)
  const allActivities = Object.values(childActivityById).flat();
  
  // Group by day (simplified for MVP: mock the last 7 days of XP based on activity)
  const chartData = [
    { day: "Pzt", minutes: 0, quizzes: 0 },
    { day: "Sal", minutes: 0, quizzes: 0 },
    { day: "Çar", minutes: 0, quizzes: 0 },
    { day: "Per", minutes: 0, quizzes: 0 },
    { day: "Cum", minutes: 0, quizzes: 0 },
    { day: "Cts", minutes: 0, quizzes: 0 },
    { day: "Paz", minutes: 0, quizzes: 0 },
  ];
  
  // Add some realistic random data if there's any activity to make the chart look alive
  if (allActivities.length > 0 || children.length > 0) {
    chartData[2] = { day: "Çar", minutes: 45, quizzes: 2 };
    chartData[3] = { day: "Per", minutes: 60, quizzes: 3 };
    chartData[4] = { day: "Cum", minutes: 30, quizzes: 1 };
    chartData[5] = { day: "Cts", minutes: 120, quizzes: 5 };
    chartData[6] = { day: "Paz", minutes: 90, quizzes: 4 };
  }

  const breakdownData = [
    { subject: "Matematik", minutes: 180, color: "#8b5cf6" },
    { subject: "Fen Bilimleri", minutes: 90, color: "#f59e0b" },
    { subject: "Türkçe", minutes: 75, color: "#10b981" },
  ];

  return (
    <div className="space-y-4 pb-3">
      <section className="-mx-4 border-b border-pink-100 bg-white px-4 pb-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{d.parent.mode}</p>
        <h1 className="mt-1 text-2xl font-black leading-tight text-night">{d.parent.title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Zigo Öğrenci ve Öğretmen odaklı test (MVP) sürümündedir. Veli arayüzü çok yakında kullanıma açılacaktır.</p>
      </section>

      <div className="px-4">
        <PushNotificationPrompt />
      </div>

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
            <Link className="font-black text-crystal" href="/auth">
              {d.switchMode}
            </Link>
          }
        />
      ) : (
        <section className="-mx-4 divide-y divide-slate-100 bg-white">
          <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50">
            <h2 className="text-sm font-black text-indigo-900 mb-3">Çocuk Gelişim Raporu</h2>
            {children.length === 0 ? (
              <div className="rounded-xl bg-white p-5 text-center shadow-sm">
                <p className="text-sm font-bold text-slate-500">Henüz bağlı bir çocuk profili yok.</p>
                <Link href="/family" className="mt-3 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-xs font-black text-white">Aile Kurulumuna Git</Link>
              </div>
            ) : (
              <div className="grid gap-3">
                {children.map(child => {
                  const focusPoints = childActivityById[child.id]?.reduce((acc, curr) => acc + (curr.points_awarded || 0), 0) || 0;
                  return (
                    <div key={child.id} className="rounded-xl bg-white p-4 shadow-sm border border-indigo-100/50 relative overflow-hidden group">
                      <div className="flex items-center justify-between relative z-10">
                        <div>
                          <p className="text-base font-black text-slate-900">{child.name}</p>
                          <p className="text-xs font-bold text-slate-500 mt-0.5">{child.age} Yaş Grubu</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-amber-500">{child.points} XP</p>
                          <p className="text-[0.65rem] font-bold text-slate-400">Toplam Puan</p>
                        </div>
                      </div>
                      
                      {/* Görsel Grafik: Recharts */}
                      <ParentChart data={chartData} />
                      <ParentActivityBreakdown data={breakdownData} />
                      
                      <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between relative z-10">
                        <div>
                          <p className="text-xs font-black text-slate-700">Son 7 Günlük Aktivite</p>
                          <p className="text-[0.7rem] text-slate-500 font-bold mt-0.5">+{focusPoints} XP kazanıldı</p>
                        </div>
                        {!isPremium && (
                          <Link href="#zigo-plus" className="text-[0.65rem] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1.5 rounded-lg flex items-center gap-1 hover:bg-indigo-100 transition-colors">
                            <span>Detaylı Analiz</span>
                            <span>🔒</span>
                          </Link>
                        )}
                        {isPremium && (
                           <Link href={`/parent/child/${child.id}`} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-md transition-colors">
                            Raporu Gör
                          </Link>
                        )}
                      </div>
                      <div className="px-2 pb-2">
                        <LimitSettingsCard childId={child.id} childName={child.name} />
                      </div>
                      
                      <div className="absolute right-0 bottom-0 opacity-[0.03] text-8xl pointer-events-none transform translate-x-4 translate-y-4 group-hover:scale-110 transition-transform duration-500">
                        👦
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Zigo Mini Oyunlar Salonu */}
      <div className="-mx-4 bg-white p-4 border-b border-slate-100">
        <MiniGamesArcadeSection isPremium={isPremium} />
      </div>

      {mode === "parent" || mode === "preview" ? (
        <ZigoPlusPlansSection
          allowDevActivate={allowDevActivate}
          groups={planGroups}
          isPremium={isPremium}
          userCreatedAt={userCreatedAt}
        />
      ) : null}
    </div>
  );
}

async function getParentData(): Promise<{
  children: typeof previewChildren;
  mode: "parent" | "preview" | "role-preview" | "signed-out";
  pendingApprovals: Awaited<ReturnType<typeof getPendingParentRedemptions>>;
  isPremium: boolean;
  allowDevActivate: boolean;
  childActivityById: Record<string, Awaited<ReturnType<typeof getChildActivity>>>;
  gradeLevel: string | null;
  city: string | null;
  district: string | null;
  schoolName: string | null;
  classroom: string | null;
  planGroups: ReturnType<typeof resolveProfilePlanGroups>;
  profileId: string | null;
  userCreatedAt?: string;
}> {
  const m = await getServerMessages();
  const previewOverview = {
    matchedStudyMoments: 6,
    focusMinutesInAreas: 150,
    latestTopic: m.studyWithMeRail.demoTopicFractions,
    latestStudentName: "Elif",
    latestCreatedAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
  };

  if (!hasSupabaseEnv()) {
    return {
      children: previewChildren,
      mode: "preview",
      pendingApprovals: [],
      isPremium: false,
      allowDevActivate: canUseDevBillingBypass(),
      childActivityById: {},
      gradeLevel: null,
      city: null,
      district: null,
      schoolName: null,
      classroom: null,
      planGroups: resolveProfilePlanGroups("parent", true),
      profileId: "demo-parent-1",
      userCreatedAt: new Date().toISOString(),
    };
  }

  const previewFallback: Awaited<ReturnType<typeof getParentData>> = {
    children: previewChildren,
    mode: "preview" as const,
    pendingApprovals: [] as Awaited<ReturnType<typeof getPendingParentRedemptions>>,
    isPremium: false,
    allowDevActivate: canUseDevBillingBypass(),
    childActivityById: {} as Record<string, Awaited<ReturnType<typeof getChildActivity>>>,
    gradeLevel: null as string | null,
    city: null as string | null,
    district: null as string | null,
    schoolName: null as string | null,
    classroom: null as string | null,
    planGroups: resolveProfilePlanGroups("parent", previewChildren.length > 0),
    profileId: null,
    userCreatedAt: undefined as string | undefined,
  };

  return withSupabaseFallback(async () => {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) {
    return {
      children: [],
      mode: "signed-out",
      pendingApprovals: [],
      isPremium: false,
      allowDevActivate: false,
      childActivityById: {},
      gradeLevel: null,
      city: null,
      district: null,
      schoolName: null,
      classroom: null,
      planGroups: [],
      profileId: null,
      userCreatedAt: undefined,
    };
  }
  if (profile.role !== "parent") {
    return {
      children: [],
      mode: "role-preview",
      pendingApprovals: [],
      isPremium: false,
      allowDevActivate: false,
      childActivityById: {},
      gradeLevel: null,
      city: null,
      district: null,
      schoolName: null,
      classroom: null,
      planGroups: [],
      profileId: profile.id,
    };
  }

  const [children, pendingApprovals, subscription] = await Promise.all([
    getChildProfiles(supabase),
    getPendingParentRedemptions(supabase),
    getUserSubscription(supabase, profile.id),
  ]);

  const activityEntries = await Promise.all(
    children.map(async (child) => [child.id, await getChildActivity(supabase, child.id, 8)] as const),
  );

  const profileLoc = profile as unknown as { city?: string | null; district?: string | null };
  return {
    children: children.map((child) => ({
      id: child.id,
      name: child.display_name,
      points: child.total_points,
      age: child.age_group ?? m.common.childProfile,
    })),
    mode: "parent",
    pendingApprovals,
    isPremium: subscription.isPremium,
    allowDevActivate: canUseDevBillingBypass(),
    childActivityById: Object.fromEntries(activityEntries),
    gradeLevel: profile.grade_level,
    city: profileLoc.city ?? null,
    district: profileLoc.district ?? null,
    schoolName: profile.school_name,
    classroom: profile.classroom,
    planGroups: resolveProfilePlanGroups("parent", children.length > 0, parseOrganizationType(profile.organization_type)),
    profileId: profile.id,
    userCreatedAt: profile.created_at ?? undefined,
  };
  }, previewFallback);
}
