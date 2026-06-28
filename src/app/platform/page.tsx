import { redirect } from "next/navigation";
import Link from "next/link";

import { LessonRequestsPanel } from "@/components/lesson-requests-panel";
import { TeacherPostForm } from "@/components/teacher-post-form";
import { TeacherQuizForm } from "@/components/teacher-quiz-form";
import { TeacherSponsoredAdsPanel } from "@/components/teacher-sponsored-ads-panel";
import { TeacherTrustBadges } from "@/components/teacher-trust-badges";
import { ZigoPlusPlansSection } from "@/components/zigo-plus-plans-section";
import { TeacherBookingsPanel } from "@/features/booking/components/teacher-bookings-panel";
import { TeacherSlotSelector } from "@/features/booking/components/teacher-slot-selector";
import { hasSupabaseEnv, withSupabaseFallback } from "@/lib/config";
import { canUseDevBillingBypass } from "@/lib/domain/billing";
import { listTeacherOwnSlots } from "@/lib/domain/ecosystem";
import { getCurrentProfile, getEducationAreas, getUserInterestAreaIds, parseOrganizationType } from "@/lib/domain/profiles";
import { shouldHideOrganizationPlanPrices } from "@/lib/domain/registration-account";
import { getUserSubscription } from "@/lib/domain/subscription";
import { resolveProfilePlanGroups } from "@/lib/domain/subscription-plans";
import { canTeacherUseCreatorPlusTools } from "@/lib/domain/teacher-creator-plus";
import { getServerMessages } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export default async function PlatformPage() {
  if (!hasSupabaseEnv()) {
    return <PlatformPreview mode="preview" />;
  }

  const previewFallback = await PlatformPreview({ mode: "preview" });

  return withSupabaseFallback(async () => {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return <PlatformPreview mode="signed-out" />;
    }

    if (profile.role === "teacher") {
      redirect("/teacher");
    }

    if (profile.role !== "platform") {
      return <PlatformPreview mode="role-preview" />;
    }

    const [allAreas, areaIds, subscription, availabilitySlots] = await Promise.all([
      getEducationAreas(supabase),
      getUserInterestAreaIds(supabase, profile.id),
      getUserSubscription(supabase, profile.id),
      listTeacherOwnSlots(supabase, profile.id),
    ]);
    const assignedAreas = allAreas.filter((area) => areaIds.includes(area.id));
    const platformCreatorPlus = canTeacherUseCreatorPlusTools(subscription, profile.role);
    const allowDevActivate = canUseDevBillingBypass();
    const planGroups = resolveProfilePlanGroups(
      "platform",
      false,
      parseOrganizationType(profile.organization_type),
    );
    const m = await getServerMessages();
    const d = m.dashboard.platform;
    const h = m.header;
    const tb = m.teacherBadges;
    const branchNames = assignedAreas.map((area) => area.area_name);

    return (
      <div className="space-y-5 pb-3">
        <section className="-mx-4 border-b border-sky-100 bg-white px-4 pb-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{d.verifiedTools}</p>
          <h2 className="mt-1 text-2xl font-black text-night">{d.studio}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">{d.desc}</p>
          <div className="mt-3">
            <TeacherTrustBadges
              branches={branchNames}
              maxVisible={4}
              moreLabel={tb.moreAreas}
              verified={profile.is_verified}
              verifiedLabel={d.verified}
            />
          </div>
          <Link className="tap-scale mt-3 inline-flex rounded-lg bg-gradient-to-r from-sky-500 to-cyan-500 px-4 py-2 text-xs font-black text-white" href="/">
            {m.dashboard.backToFeed}
          </Link>
          <span className="ml-2 mt-3 inline-flex rounded-lg bg-gradient-to-r from-sky-500/10 to-cyan-500/10 px-3 py-2 text-xs font-black text-sky-700">
            {profile.is_verified ? d.verified : d.verificationRequired}
          </span>
        </section>

        <LessonRequestsPanel role="platform" viewerId={profile.id} />

        {profile.is_verified ? (
          <TeacherSlotSelector
            initialSlots={availabilitySlots}
            labels={{
              title: m.ecosystem.calendarTitle,
              desc: m.ecosystem.calendarDesc,
              start: m.ecosystem.slotStart,
              end: m.ecosystem.slotEnd,
              add: m.ecosystem.addSlot,
              empty: m.ecosystem.noOwnSlots,
              booked: m.ecosystem.slotBooked,
              open: m.ecosystem.slotOpen,
            }}
          />
        ) : null}

        {profile.is_verified ? (
          <TeacherBookingsPanel
            labels={{
              title: m.ecosystem.bookingsTitle,
              desc: m.ecosystem.bookingsDesc,
              empty: m.ecosystem.bookingsEmpty,
              complete: m.ecosystem.completeBooking,
              cancel: m.ecosystem.cancelBooking,
              completed: m.ecosystem.bookingCompleted,
              cancelled: m.ecosystem.bookingCancelled,
              statusBooked: m.ecosystem.statusBooked,
              statusCompleted: m.ecosystem.statusCompleted,
              statusCancelled: m.ecosystem.statusCancelled,
              startLesson: m.liveLessons.startLesson,
              joinLesson: m.liveLessons.joinLesson,
              notYet: m.liveLessons.notYet,
              lessonCompleted: m.liveLessons.lessonCompleted,
            }}
          />
        ) : null}

        {profile.is_verified ? (
          <>
            <section className="zigo-dashboard-grid">
              <PlatformLink accent="from-sky-500 to-cyan-500" href="/create" label={h.create} text={m.dock.teacherHint} />
              <PlatformLink accent="from-cyan-500 to-teal-500" href="/profile" label={m.nav.profile} text={d.creatorGrid} />
            </section>
            {!platformCreatorPlus ? (
              <p className="-mx-4 border-b border-amber-100 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
                Paylaşım ve yorum ücretsiz. Yazılı hazırlık, quiz ve sponsorlu reklam için Creator Plus gerekir.
              </p>
            ) : null}
            <TeacherPostForm areas={assignedAreas} />
            <TeacherQuizForm areas={assignedAreas} canCreateQuizzes={platformCreatorPlus} allowDevActivate={allowDevActivate} />
            <TeacherSponsoredAdsPanel canManage={platformCreatorPlus} />
          </>
        ) : (
          <VerificationRequired messages={m.teacherPage} />
        )}
        <section className="zigo-dashboard-grid">
          <PlatformLink accent="from-sun to-peach" href="/moderation" label={d.moderation} text={d.reviewComments} />
          <PlatformLink accent="from-sky-500 to-cyan-500" href="/questions" label={d.qa} text={d.answerSafely} />
        </section>

        <ZigoPlusPlansSection
          allowDevActivate={allowDevActivate}
          groups={planGroups}
          hidePrices={shouldHideOrganizationPlanPrices(parseOrganizationType(profile.organization_type))}
          isPremium={platformCreatorPlus}
        />
      </div>
    );
  }, previewFallback);
}

async function PlatformPreview({ mode }: { mode: "preview" | "signed-out" | "role-preview" }) {
  const messages = await getServerMessages();
  const t = messages.dashboard.platform;
  const tp = messages.teacherPage;
  const h = messages.header;
  const note = {
    preview: t.previewNote,
    "signed-out": t.signInNote,
    "role-preview": t.roleNote,
  }[mode];

  return (
    <div className="space-y-4 pb-3">
      <section className="-mx-4 border-b border-slate-100 bg-white px-4 pb-4">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">{t.studio}</p>
        <h1 className="mt-1 text-2xl font-black leading-tight text-night">{t.verifiedTools}.</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">{note}</p>
      </section>
      <section className="zigo-dashboard-grid">
        <PlatformLink accent="from-sky-500 to-cyan-500" href="/create" label={h.create} text={tp.postOrStory} />
        <PlatformLink accent="from-sun to-peach" href="/moderation" label={t.moderation} text={tp.safetyQueue} />
        <PlatformLink accent="from-sky-500 to-cyan-500" href="/questions" label={t.qa} text={tp.teacherAnswers} />
        <PlatformLink accent="from-cyan-500 to-teal-500" href="/onboarding" label={tp.areas} text={tp.expertiseSetup} />
      </section>
    </div>
  );
}

function VerificationRequired({
  messages: t,
}: {
  messages: Awaited<ReturnType<typeof getServerMessages>>["teacherPage"];
}) {
  const verificationSteps = [
    { label: t.completeProfile, state: t.done },
    { label: t.chooseAreas, state: t.required },
    { label: t.platformVerifies, state: t.pending },
    { label: t.publishingUnlocks, state: t.locked },
  ];

  return (
    <section className="-mx-4 space-y-4 bg-white px-4 py-5">
      <div className="rounded-lg bg-gradient-to-br from-sky-500 via-cyan-500 to-teal-500 p-5 text-white">
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

      <div className="grid gap-2">
        {verificationSteps.map((step) => (
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3" key={step.label}>
            <span className="text-sm font-black text-night">{step.label}</span>
            <span className="rounded-lg bg-white px-3 py-1 text-xs font-black text-sky-600">{step.state}</span>
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-sky-50 px-4 py-3">
        <p className="text-sm font-black text-night">{t.whatNow}</p>
        <p className="mt-1 text-sm font-bold leading-6 text-slate-600">
          {t.whatNowDesc}
        </p>
      </div>

      <Link className="tap-scale block rounded-lg bg-gradient-to-r from-sky-500 to-cyan-500 px-4 py-3 text-center text-sm font-black text-white" href="/onboarding">
        {t.updateAreas}
      </Link>
    </section>
  );
}

function PlatformLink({ accent = "from-sky-500 to-cyan-500", href, label, text }: { accent?: string; href: string; label: string; text: string }) {
  return (
    <Link className={`tap-scale rounded-lg bg-gradient-to-br ${accent} p-4 text-white`} href={href}>
      <p className="text-base font-black">{label}</p>
      <p className="mt-1 text-xs font-bold text-white/78">{text}</p>
    </Link>
  );
}
