import Link from "next/link";

import { LessonRequestsPanel } from "@/components/lesson-requests-panel";
import { OrgDashboardPanel } from "@/components/org-dashboard-panel";
import { TeacherQuizForm } from "@/components/teacher-quiz-form";
import { isMicroQuizPack } from "@/lib/domain/micro-quiz-pack";
import { TeacherSponsoredAdsPanel } from "@/components/teacher-sponsored-ads-panel";
import { InviteCodesPanel } from "@/components/invite-codes-panel";
import { TeacherTrustBadges } from "@/components/teacher-trust-badges";
import { WhatsAppSupportCard } from "@/components/whatsapp-support-card";
import { ZigoPlusPlansSection } from "@/components/zigo-plus-plans-section";
import { hasSupabaseEnv, withSupabaseFallback } from "@/lib/config";
import { canUseDevBillingBypass } from "@/lib/domain/billing";
import { getOrgDashboardSnapshot } from "@/lib/domain/org-dashboard";
import { displayEducationAreaName } from "@/lib/domain/education-catalog";
import { getCurrentProfile, getEducationAreas, getUserInterestAreaIds, parseOrganizationType } from "@/lib/domain/profiles";
import { isOrganizationRegistrationType, shouldHideOrganizationPlanPrices } from "@/lib/domain/registration-account";
import { resolveWrongRoleStudioHref } from "@/lib/domain/role-next-action";
import { getUserSubscription } from "@/lib/domain/subscription";
import { resolveProfilePlanGroups } from "@/lib/domain/subscription-plans";
import { canTeacherUseCreatorPlusTools } from "@/lib/domain/teacher-creator-plus";
import {
  getTeacherActivationState,
  type ActivationStepStatus,
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

  if (profile.role !== "teacher") {
    return <TeacherPreview mode="role-preview" viewerRole={profile.role} />;
  }

  const [allAreas, areaIds, subscription, activation] = await Promise.all([
    getEducationAreas(supabase),
    getUserInterestAreaIds(supabase, profile.id),
    getUserSubscription(supabase, profile.id),
    getTeacherActivationState(supabase, {
      userId: profile.id,
      fullName: profile.full_name,
      isVerified: profile.is_verified,
    }),
  ]);
  const organizationType = parseOrganizationType(profile.organization_type);
  const orgDashboard = organizationType
    ? await getOrgDashboardSnapshot(supabase, profile.id, organizationType)
    : null;
  const assignedAreas = allAreas.filter((area) => areaIds.includes(area.id));
  const teacherCreatorPlus = canTeacherUseCreatorPlusTools(subscription, profile.role);
  const allowDevActivate = canUseDevBillingBypass();
  const planGroups = resolveProfilePlanGroups(
    "teacher",
    false,
    organizationType,
  );
  const m = await getServerMessages();
  const d = m.dashboard;
  const h = m.header;
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

  return (
    <div className="space-y-5 pb-3">
      <section className="-mx-4 border-b border-pink-100 bg-white px-4 pb-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{d.teacher.verifiedTools}</p>
        <h2 className="mt-1 text-2xl font-black text-night">{d.teacher.studio}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{d.teacher.desc}</p>
        <div className="mt-3">
          <TeacherTrustBadges
            branches={branchNames}
            maxVisible={4}
            moreLabel={tb.moreAreas}
            verified={profile.is_verified}
            verifiedLabel={tb.verifiedTeacher}
          />
        </div>
        <Link className="tap-scale mt-3 inline-flex rounded-lg bg-gradient-to-r from-crystal to-berry px-4 py-2 text-xs font-black text-white" href="/">
          {d.backToFeed}
        </Link>
        <span className="ml-2 mt-3 inline-flex rounded-lg bg-gradient-to-r from-aqua/10 to-mint/10 px-3 py-2 text-xs font-black text-aqua">
          {profile.is_verified ? d.teacher.verified : d.teacher.verificationRequired}
        </span>
      </section>

      {orgDashboard ? <OrgDashboardPanel copy={orgCopy} snapshot={orgDashboard} /> : null}

      {profile.is_verified && !activation.hasAreas ? (
        <section className="-mx-4 border-b border-amber-100 bg-amber-50 px-4 py-4">
          <p className="text-sm font-black text-amber-900">{m.teacherPage.chooseAreas}</p>
          <p className="mt-1 text-sm font-bold leading-6 text-amber-800">{m.teacherPage.whatNowDesc}</p>
        </section>
      ) : null}

      {!isOrganizationRegistrationType(organizationType) ? (
        <LessonRequestsPanel role="teacher" viewerId={profile.id} />
      ) : null}

      {profile.is_verified ? (
        <>
          <section className="grid grid-cols-2 gap-2">
            <TeacherLink accent="from-crystal to-berry" href="/create" label={h.create} text={m.dock.teacherHint} />
            <TeacherLink accent="from-aqua to-mint" href="/profile" label={m.nav.profile} text={d.teacher.creatorGrid} />
          </section>
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
          <TeacherQuizForm areas={assignedAreas} canCreateQuizzes={teacherCreatorPlus} allowDevActivate={allowDevActivate} />
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
          <h1 className="mt-1 text-2xl font-black leading-tight text-night">{t.verifiedTools}.</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{note}</p>
          <Link
            className="tap-scale mt-4 inline-flex rounded-lg bg-night px-4 py-3 text-sm font-black text-white"
            href={href}
          >
            {mode === "signed-out" ? messages.common.signIn : messages.nav.home}
          </Link>
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
        <div className="mt-4">
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
