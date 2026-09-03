import Link from "next/link";

import { AdCampaignsManager } from "@/components/ad-campaigns-manager";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";
import { CreateAdCampaignModal } from "@/components/create-ad-campaign-modal";
import { InviteCodesPanel } from "@/components/invite-codes-panel";
import { LessonRequestsPanel } from "@/components/lesson-requests-panel";
import { MiniGamesArcadeSection } from "@/components/mini-games-arcade-section";
import { OrgDashboardPanel } from "@/components/org-dashboard-panel";
import { PushNotificationPrompt } from "@/components/PushNotificationPrompt";
import { StudioTabsLayout } from "@/components/studio-tabs-layout";
import { TeacherLeaderboardCard, type TeacherLeaderboardEntry } from "@/components/teacher-leaderboard-card";
import { TeacherQuizForm } from "@/components/teacher-quiz-form";
import { TeacherSponsoredAdsPanel } from "@/components/teacher-sponsored-ads-panel";
import { TeacherTrustBadges } from "@/components/teacher-trust-badges";
import { WhatsAppSupportCard } from "@/components/whatsapp-support-card";
import { ZigoPlusPlansSection } from "@/components/zigo-plus-plans-section";
import { hasSupabaseEnv, withSupabaseFallback } from "@/lib/config";
import { canUseDevBillingBypass } from "@/lib/domain/billing";
import { displayEducationAreaName } from "@/lib/domain/education-catalog";
import { isMicroQuizPack } from "@/lib/domain/micro-quiz-pack";
import { getOrgDashboardSnapshot } from "@/lib/domain/org-dashboard";
import { getCurrentProfile, getEducationAreas, getUserInterestAreaIds, parseOrganizationType } from "@/lib/domain/profiles";
import { isOrganizationRegistrationType, shouldHideOrganizationPlanPrices } from "@/lib/domain/registration-account";
import { resolveWrongRoleStudioHref } from "@/lib/domain/role-next-action";
import { getUserSubscription } from "@/lib/domain/subscription";
import { resolveProfilePlanGroups } from "@/lib/domain/subscription-plans";
import { canTeacherUseCreatorPlusTools } from "@/lib/domain/teacher-creator-plus";
import {
  type ActivationStepStatus,
  getTeacherActivationState,
  type TeacherActivationState,
  type TeacherActivationStepId,
} from "@/lib/domain/verification-activation";
import { getServerMessages } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export default async function TeacherPage({
  searchParams,
}: {
  searchParams?: Promise<{ pack?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const showMicroQuizPack = isMicroQuizPack(params.pack);

  if (!hasSupabaseEnv()) {
    return <TeacherPreview mode="preview" showMicroQuizPack={showMicroQuizPack} />;
  }

  const previewFallback = await TeacherPreview({ mode: "preview", showMicroQuizPack });

  return withSupabaseFallback(async () => {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile) {
    return <TeacherPreview mode="signed-out" />;
  }

  const userRoleStr = (profile.role as string) || "";
  const isCreatorRole =
    userRoleStr === "teacher" ||
    userRoleStr === "education_institution" ||
    userRoleStr === "education_platform" ||
    userRoleStr === "publisher";

  if (!isCreatorRole) {
    return <TeacherPreview mode="role-preview" viewerRole={profile.role} />;
  }

  const [allAreas, areaIds, subscription, activation, leaderboardResult] = await Promise.all([
    getEducationAreas(supabase),
    getUserInterestAreaIds(supabase, profile.id),
    getUserSubscription(supabase, profile.id),
    getTeacherActivationState(supabase, {
      userId: profile.id,
      fullName: profile.full_name,
      isVerified: profile.is_verified,
    }),
    supabase
      .from("users")
      .select("id, full_name, avatar_url, total_points")
      .eq("role", "teacher")
      .order("total_points", { ascending: false })
      .limit(10),
  ]);
  const organizationType = parseOrganizationType(profile.organization_type);
  const orgDashboard = organizationType
    ? await getOrgDashboardSnapshot(supabase, profile.id, organizationType)
    : null;
  const assignedAreas = allAreas.filter((area) => areaIds.includes(area.id));
  const teacherCreatorPlus = canTeacherUseCreatorPlusTools(subscription, profile.role);
  
  let quizCount = 0;
  if (!teacherCreatorPlus) {
    const { count } = await supabase
      .from("quizzes")
      .select("id", { count: "exact", head: true })
      .eq("teacher_id", profile.id);
    quizCount = count || 0;
  }
  const canCreateQuizzes = teacherCreatorPlus || quizCount < 3;
  const allowDevActivate = canUseDevBillingBypass();
  const planGroups = resolveProfilePlanGroups(
    "teacher",
    false,
    organizationType,
  );
  const m = await getServerMessages();
  const d = m.dashboard;
  const _h = m.header;
  const tb = m.teacherBadges;
  const branchNames = assignedAreas.map((area) => displayEducationAreaName(area.area_name));
  const orgCopy = {
    eyebrow: d.teacher.orgEyebrow,
    titleInstitution: d.teacher.orgTitleInstitution,
    titlePlatform: d.teacher.orgTitlePlatform,
    titlePublisher: d.teacher.orgTitlePublisher,
    descInstitution: d.teacher.orgDescInstitution,
    descPlatform: d.teacher.orgDescPlatform,
    descPublisher: d.teacher.orgDescPublisher,
    metricPosts7d: d.teacher.orgMetricPosts7d,
    metricPostsTotal: d.teacher.orgMetricPostsTotal,
    metricFollowers: d.teacher.orgMetricFollowers,
    metricAreas: d.teacher.orgMetricAreas,
    metricSponsored: d.teacher.orgMetricSponsored,
    metricOpenQuestions: d.teacher.orgMetricOpenQuestions,
    areasEmpty: d.teacher.orgAreasEmpty,
    openStudio: d.teacher.orgOpenStudio,
    openCreate: d.teacher.orgOpenCreate,
    openQuestions: d.teacher.orgOpenQuestions,
    openAdvertise: d.teacher.orgOpenAdvertise,
  };
  
  const teacherLeaderboard: TeacherLeaderboardEntry[] = (leaderboardResult.data ?? []).map((t, index) => ({
    userId: t.id,
    fullName: t.full_name,
    avatarUrl: t.avatar_url,
    totalPoints: t.total_points,
    rank: index + 1,
  }));

  return (
    <div className="space-y-5 pb-3">
      {/* Studio Header Banner */}
      <section className="-mx-4 bg-gradient-to-br from-night via-violet-950 to-crystal px-5 py-6 text-white shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <span className="inline-block rounded-md bg-white/15 px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-[0.16em] text-white/90 backdrop-blur">
              {d.teacher.verifiedTools}
            </span>
            <h1 className="mt-2 text-2xl font-black tracking-tight">{d.teacher.studio}</h1>
            <p className="mt-1 text-xs font-bold leading-5 text-white/75">{d.teacher.desc}</p>
          </div>
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur">
            <svg aria-hidden="true" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect height="7" rx="1" width="7" x="3" y="3" />
              <rect height="7" rx="1" width="7" x="14" y="3" />
              <rect height="7" rx="1" width="7" x="14" y="14" />
              <rect height="7" rx="1" width="7" x="3" y="14" />
            </svg>
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <TeacherTrustBadges
            branches={branchNames}
            maxVisible={4}
            moreLabel={tb.moreAreas}
            verified={profile.is_verified}
            verifiedLabel={tb.verifiedTeacher}
          />
        </div>
      </section>

      {/* Studio Tabs Container */}
      <StudioTabsLayout
        analyticsNode={
          <div className="space-y-6">
            <AnalyticsDashboard postCount={assignedAreas.length * 3 + 4} />
            {orgDashboard ? <OrgDashboardPanel copy={orgCopy} snapshot={orgDashboard} /> : null}
            <TeacherLeaderboardCard entries={teacherLeaderboard} viewerId={profile.id} />
          </div>
        }
        contentStudioNode={
          <div className="space-y-5">
            {/* Quick Content Studio Actions */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">İçerik Stüdyosu Eylemleri</p>
                <CreateAdCampaignModal triggerLabel="📢 Reklam / Afiş Oluştur" />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  className="tap-scale group relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 p-4 text-white shadow-sm transition hover:shadow-md"
                  href="/create?mode=micro"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur">
                      <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect height="16" rx="4" width="18" x="3" y="4" />
                        <path d="M11 12l4 2.5-4 2.5z" />
                      </svg>
                    </span>
                    <span className="text-[0.62rem] font-black uppercase tracking-wider text-white/80">Video</span>
                  </div>
                  <p className="mt-3 text-sm font-black">Mikro Ders Çek</p>
                  <p className="mt-0.5 text-[0.68rem] font-semibold text-white/80">Reel video içeriği yükle</p>
                </Link>

                <Link
                  className="tap-scale group relative overflow-hidden rounded-2xl bg-gradient-to-br from-crystal to-berry p-4 text-white shadow-sm transition hover:shadow-md"
                  href="/create?mode=post"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur">
                      <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </span>
                    <span className="text-[0.62rem] font-black uppercase tracking-wider text-white/80">Ders</span>
                  </div>
                  <p className="mt-3 text-sm font-black">Ders Gönderisi</p>
                  <p className="mt-0.5 text-[0.68rem] font-semibold text-white/80">Görselli ders notu veya özet</p>
                </Link>

                <Link
                  className="tap-scale group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-4 text-white shadow-sm transition hover:shadow-md"
                  href="/create?mode=spark"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur">
                      <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                      </svg>
                    </span>
                    <span className="text-[0.62rem] font-black uppercase tracking-wider text-white/80">Spark</span>
                  </div>
                  <p className="mt-3 text-sm font-black">Günlük Spark / Story</p>
                  <p className="mt-0.5 text-[0.68rem] font-semibold text-white/80">Öğrencilerine hızlı duyuru</p>
                </Link>

                <Link
                  className="tap-scale group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 p-4 text-white shadow-sm transition hover:shadow-md"
                  href="/profile"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur">
                      <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    <span className="text-[0.62rem] font-black uppercase tracking-wider text-white/80">Izgara</span>
                  </div>
                  <p className="mt-3 text-sm font-black">İçerik Izgaran</p>
                  <p className="mt-0.5 text-[0.68rem] font-semibold text-white/80">Paylaştığın tüm materyaller</p>
                </Link>
              </div>
            </section>

            {/* Zigo Mini Zeka Oyunları */}
            <div className="rounded-2xl bg-white p-4 border border-slate-100 shadow-xs">
              <MiniGamesArcadeSection isPremium={teacherCreatorPlus} />
            </div>

            {/* Quiz Builder Form */}
            {profile.is_verified ? (
              <div className="md:hidden">
                <TeacherQuizForm
                  allowDevActivate={allowDevActivate}
                  areas={assignedAreas}
                  canCreateQuizzes={canCreateQuizzes}
                />
              </div>
            ) : null}
          </div>
        }
        adsNode={
          <div className="space-y-4">
            <AdCampaignsManager />
            <TeacherSponsoredAdsPanel profile={profile} />
          </div>
        }
        requestsNode={
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-4 text-white shadow-sm">
              <div>
                <span className="text-[0.65rem] font-black uppercase tracking-wider text-violet-200">Topluluk Soru Havuzu</span>
                <h3 className="text-sm font-black mt-0.5">Öğrenci & Veli Soruları</h3>
                <p className="text-xs text-violet-100 font-semibold mt-1">Soruları yanıtla, profil itibarını artır ve velilere ulaş.</p>
              </div>
              <Link
                href="/questions"
                className="tap-scale shrink-0 rounded-xl bg-white px-3.5 py-2 text-xs font-black text-violet-700 shadow hover:bg-violet-50 transition"
              >
                Soruları Gör ↗
              </Link>
            </div>

            {!isOrganizationRegistrationType(organizationType) ? (
              <LessonRequestsPanel 
                role="teacher" 
                viewerId={profile.id} 
                isSubscriber={teacherCreatorPlus} 
              />
            ) : null}
          </div>
        }
      />

      {profile.is_verified ? (
        <>
          {!teacherCreatorPlus ? (
            <p className="-mx-4 border-b border-amber-100 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
              {m.billingUi.creatorPlusHint}
            </p>
          ) : null}
          {showMicroQuizPack ? (
            <section className="-mx-4 border-b border-violet-100 bg-violet-50 px-4 py-3">
              <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-crystal">Mikro + quiz paketi</p>
              <p className="mt-1 text-sm font-black text-night">10 soruluk quiz oluştur (A–D)</p>
              <Link className="mt-2 inline-flex text-xs font-black text-crystal" href="/create?mode=micro&pack=micro-quiz">
                Mikro ders adımına dön
              </Link>
            </section>
          ) : null}
          {profile.is_verified ? (
            <TeacherQuizForm areas={assignedAreas} canCreateQuizzes={canCreateQuizzes} allowDevActivate={allowDevActivate} />
          ) : null}
          <TeacherSponsoredAdsPanel profile={profile} />
          <InviteCodesPanel canCreate />
        </>
      ) : (
        <VerificationRequired activation={activation} messages={m.teacherPage} support={m.support} />
      )}
      <section className="grid grid-cols-2 gap-2">
        <TeacherLink accent="from-sun to-peach" href="/moderation" label={d.teacher.moderation} text={d.teacher.reviewComments} />
        <TeacherLink accent="from-berry to-peach" href="/questions" label={d.teacher.qa} text={d.teacher.answerSafely} />
      </section>

      <ZigoPlusPlansSection
        allowDevActivate={allowDevActivate}
        groups={planGroups}
        hidePrices={shouldHideOrganizationPlanPrices(organizationType)}
        isPremium={teacherCreatorPlus}
        organizationName={profile.full_name}
        organizationType={organizationType}
        userCreatedAt={profile.created_at ?? undefined}
      />

      <WhatsAppSupportCard
        buttonLabel={m.support.button}
        context="teacher"
        description={m.support.description}
        eyebrow={m.support.eyebrow}
        hoursLabel={m.support.hours}
        prefilledMessage={m.support.messageTeacher}
        privacyNote={m.support.privacyNote}
        role="teacher"
        title={m.support.title}
      />
    </div>
  );
  }, previewFallback);
}

async function TeacherPreview({
  mode,
  viewerRole = "guest",
  showMicroQuizPack = false,
}: {
  mode: "preview" | "signed-out" | "role-preview";
  viewerRole?: "student" | "parent" | "teacher" | "guest";
  showMicroQuizPack?: boolean;
}) {
  const messages = await getServerMessages();
  const t = messages.dashboard.teacher;
  const tp = messages.teacherPage;
  void showMicroQuizPack;
  const note = {
    preview: t.previewNote,
    "signed-out": t.signInNote,
    "role-preview": t.roleNote,
  }[mode];

  // Wrong-role / signed-out users should not see teacher create tools.
  if (mode === "signed-out" || mode === "role-preview") {
    const href = mode === "signed-out" ? "/auth" : resolveWrongRoleStudioHref(viewerRole);
    return (
      <div className="space-y-4 pb-3">
        <section className="-mx-4 border-b border-slate-100 bg-white px-4 pb-4">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">{t.studio}</p>
          <h1 className="mt-1 text-2xl font-black leading-tight text-night">Öğretmen & Üretici Stüdyosu</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {mode === "signed-out"
              ? "Üretici Stüdyosu araçlarını kullanabilmek için lütfen giriş yapın."
              : "Şu anki hesabınız Öğrenci veya Veli rolünde. Üretim Stüdyosu araçlarını kullanmak için Öğretmen veya Kurum rolüne geçebilirsiniz."}
          </p>

          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <Link
              className="tap-scale inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-sm font-black text-white shadow-sm hover:brightness-105"
              href={mode === "signed-out" ? "/auth" : "/onboarding/role-setup"}
            >
              {mode === "signed-out" ? "Giriş Yap / Kaydol ↗" : "🎓 Öğretmen / Kurum Rolüne Geç ↗"}
            </Link>
            <Link
              className="tap-scale inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
              href={href}
            >
              {mode === "signed-out" ? "Ana Sayfaya Dön" : "Kendi Paneline Dön"}
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-3">
      <section className="-mx-4 border-b border-slate-100 bg-white px-4 pb-4">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">{t.studio}</p>
        <h1 className="mt-1 text-2xl font-black leading-tight text-night">{t.verifiedTools}.</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">{note}</p>
      </section>
      <section className="grid grid-cols-2 gap-2">
        <TeacherLink accent="from-crystal to-berry" href="/create" label={messages.header.create} text={tp.postOrStory} />
        <TeacherLink accent="from-sun to-peach" href="/moderation" label={t.moderation} text={tp.safetyQueue} />
        <TeacherLink accent="from-berry to-peach" href="/questions" label={t.qa} text={tp.teacherAnswers} />
        <TeacherLink accent="from-aqua to-mint" href="/onboarding" label={tp.areas} text={tp.expertiseSetup} />
      </section>
    </div>
  );
}

function VerificationRequired({
  activation,
  messages: t,
  support,
}: {
  activation: TeacherActivationState;
  messages: Awaited<ReturnType<typeof getServerMessages>>["teacherPage"];
  support: Awaited<ReturnType<typeof getServerMessages>>["support"];
}) {
  const stepLabels: Record<TeacherActivationStepId, string> = {
    completeProfile: t.completeProfile,
    assignAreas: t.chooseAreas,
    platformVerify: t.platformVerifies,
    publishingUnlock: t.publishingUnlocks,
  };
  const statusLabels: Record<ActivationStepStatus, string> = {
    done: t.done,
    pending: t.pending,
    required: t.required,
    locked: t.locked,
  };
  const statusClass: Record<ActivationStepStatus, string> = {
    done: "bg-emerald-50 text-emerald-700",
    pending: "bg-amber-50 text-amber-700",
    required: "bg-rose-50 text-rose-700",
    locked: "bg-slate-100 text-slate-500",
  };

  return (
    <section className="-mx-4 space-y-4 bg-white px-4 py-5">
      <div className="rounded-lg bg-gradient-to-br from-crystal via-berry to-aqua p-5 text-white">
        <span className="flex size-14 items-center justify-center rounded-lg bg-white/20 text-white backdrop-blur">
          <svg aria-hidden="true" className="size-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 3l7 4v5c0 4.5-2.9 7.6-7 9-4.1-1.4-7-4.5-7-9V7z" />
            <path d="m9 12 2 2 4-5" />
          </svg>
        </span>
        <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-white/75">
          {t.verificationApplication}
        </p>
        <h2 className="mt-1 text-2xl font-black">{t.publishingLocked}</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-white/82">
          {t.verificationDesc}
        </p>
      </div>

      <div className="px-4">
        <PushNotificationPrompt />
      </div>

      <div className="px-4">
        <WhatsAppSupportCard
          buttonLabel={support.button}
          compact
          context="teacher"
          description=""
          eyebrow=""
          hoursLabel=""
          prefilledMessage={support.messageTeacher}
          privacyNote=""
          role="teacher"
          title=""
        />
      </div>

      <div className="grid gap-2">
        {activation.steps.map((step) => (
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3" key={step.id}>
            <span className="text-sm font-black text-night">{stepLabels[step.id]}</span>
            <span className={`rounded-lg px-3 py-1 text-xs font-black ${statusClass[step.status]}`}>
              {statusLabels[step.status]}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-violet-50 px-4 py-3">
        <p className="text-sm font-black text-night">{t.whatNow}</p>
        <p className="mt-1 text-sm font-bold leading-6 text-slate-600">
          {activation.isVerified && activation.hasAreas ? t.activationReady : t.whatNowDesc}
        </p>
      </div>

      <div className="grid gap-2">
        <Link className="tap-scale block rounded-lg bg-gradient-to-r from-crystal to-berry px-4 py-3 text-center text-sm font-black text-white" href="/onboarding">
          {t.updateAreas}
        </Link>
        {activation.isVerified && activation.hasAreas ? (
          <Link className="tap-scale block rounded-lg border border-slate-200 bg-white px-4 py-3 text-center text-sm font-black text-night" href="/create">
            {t.openCreate}
          </Link>
        ) : null}
      </div>
    </section>
  );
}

function TeacherLink({ accent = "from-crystal to-berry", href, label, text }: { accent?: string; href: string; label: string; text: string }) {
  return (
    <Link className={`tap-scale rounded-lg bg-gradient-to-br ${accent} p-4 text-white`} href={href}>
      <p className="text-base font-black">{label}</p>
      <p className="mt-1 text-xs font-bold text-white/78">{text}</p>
    </Link>
  );
}
