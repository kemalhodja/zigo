import Link from "next/link";

import { InterestSelector } from "@/components/interest-selector";
import { OnboardingIntakeQuiz } from "@/components/onboarding-intake-quiz";
import { ProfileForm } from "@/components/profile-form";
import { SignOutButton } from "@/components/sign-out-button";
import { SponsoredCampaignsRail } from "@/components/sponsored-campaigns-rail";
import { StateCard } from "@/components/state-card";
import { SupabaseSetupCard } from "@/components/supabase-setup-card";
import { hasSupabaseEnv, withSupabaseFallback } from "@/lib/config";
import { getOnboardingIntake } from "@/lib/domain/onboarding-intake";
import { getCurrentProfile, getEducationAreas, getUserInterestAreaIds, parseOrganizationType } from "@/lib/domain/profiles";
import { listSponsoredTeacherCampaigns } from "@/lib/domain/teacher-campaign";
import { getServerMessages } from "@/lib/i18n/server";
import type { Messages } from "@/lib/i18n/types";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/database.types";

export default async function OnboardingPage() {
  const m = await getServerMessages();
  const o = m.onboardingPage;
  const ob = m.onboarding;

  if (!hasSupabaseEnv()) {
    return <SupabaseSetupCard />;
  }

  return withSupabaseFallback(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <StateCard
        title={o.signInCreate}
        description={o.signInCreateDesc}
        action={
          <Link className="font-black text-crystal" href="/auth">
            {o.goToAuth}
          </Link>
        }
      />
    );
  }

  const profile = await getCurrentProfile(supabase);

  if (!profile) {
    return (
      <div className="space-y-5">
        <section className="-mx-4 border-b border-slate-100 bg-white px-4 pb-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{o.step1}</p>
          <h2 className="mt-1 text-2xl font-black text-night">{o.createProfile}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">{o.createProfileDesc}</p>
        </section>
        <ProfileForm />
      </div>
    );
  }

  const [areas, selectedAreaIds, sponsoredCampaigns, intake] = await Promise.all([
    getEducationAreas(supabase),
    getUserInterestAreaIds(supabase, profile.id),
    getUserInterestAreaIds(supabase, profile.id).then(async (areaIds) => {
      if (areaIds.length === 0) return [];
      try {
        return await listSponsoredTeacherCampaigns(supabase, 6, "explore");
      } catch {
        return [];
      }
    }),
    profile.role === "student" || profile.role === "parent"
      ? getOnboardingIntake(supabase, profile.id)
      : Promise.resolve(null),
  ]);

  const roleNote =
    profile.role === "teacher"
      ? profile.is_verified
        ? ob.teacherVerified
        : ob.teacherReady
      : ob.profileReady;

  const organizationType = parseOrganizationType(profile.organization_type);
  const isOrganizationTeacher = (profile.role === "teacher" || profile.role === "platform") && Boolean(organizationType);

  return (
    <div className="space-y-5">
      <section className="-mx-4 border-b border-slate-100 bg-white px-4 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{o.step2}</p>
            <h2 className="mt-1 text-2xl font-black text-night">{ob.chooseFeed}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{ob.chooseFeedDesc}</p>
          </div>
          <SignOutButton />
        </div>
      </section>

      {!intake && (profile.role === "student" || profile.role === "parent") ? (
        <OnboardingIntakeQuiz
          areaOptions={areas.map((area) => ({ id: area.id, name: area.area_name }))}
        />
      ) : null}

      <section className="-mx-4 bg-white px-4 py-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-crystal">{m.roles[profile.role]}</p>
        <h3 className="mt-2 text-xl font-black text-night">{profile.full_name}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{roleNote}</p>
        {selectedAreaIds.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link className="tap-scale rounded-lg bg-gradient-to-r from-crystal to-berry px-4 py-3 text-center text-sm font-black text-white" href="/">
              {ob.previewFeed}
            </Link>
            {profile.role === "teacher" ? (
              <Link className="tap-scale rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-3 text-center text-sm font-black text-white" href="/profile/edit">
                Profesyonel profil
              </Link>
            ) : (
              <Link className="tap-scale rounded-lg bg-gradient-to-r from-aqua to-mint px-4 py-3 text-center text-sm font-black text-white" href={profile.role === "parent" ? "/family" : "/micro"}>
                {profile.role === "parent" ? ob.addChild : m.nav.micro}
              </Link>
            )}
          </div>
        ) : null}
      </section>

      <NextBestActionPanel
        hasAreas={selectedAreaIds.length > 0}
        isVerified={profile.is_verified}
        messages={m}
        role={profile.role}
      />

      {selectedAreaIds.length > 0 && sponsoredCampaigns.length > 0 ? (
        <SponsoredCampaignsRail
          campaigns={sponsoredCampaigns}
          desc={m.teacherCampaign.registrationAnnounceOnboardingDesc}
          policyHref="/legal/sponsorship"
          policyLabel={m.teacherCampaign.policyLink}
          sponsoredLabel={m.teacherCampaign.sponsoredBadge}
          title={m.teacherCampaign.registrationAnnounceTitle}
        />
      ) : null}

      {(profile.role === "teacher" || profile.role === "platform") && !profile.is_verified && !isOrganizationTeacher ? (
        <TeacherPendingCard messages={m} />
      ) : areas.length === 0 ? (
        <StateCard
          title={o.noAreas}
          description={o.noAreasDesc}
          action={
            <Link className="font-black text-crystal" href="/setup">
              {ob.openSetup}
            </Link>
          }
        />
      ) : (
        <InterestSelector
          areas={areas}
          initialOrganizationType={parseOrganizationType(profile.organization_type)}
          initialSelectedAreaIds={selectedAreaIds}
          role={profile.role}
        />
      )}
    </div>
  );
  }, <SupabaseSetupCard />);
}

function NextBestActionPanel({
  hasAreas,
  isVerified,
  messages: m,
  role,
}: {
  hasAreas: boolean;
  isVerified: boolean;
  messages: Messages;
  role: UserRole;
}) {
  const ob = m.onboarding;
  const o = m.onboardingPage;
  const isPublisher = role === "teacher" || role === "platform";
  const actions = getNextActions({ hasAreas, isVerified, role, messages: m });

  return (
    <section className="-mx-4 border-y border-violet-100 bg-gradient-to-r from-violet-50 via-pink-50 to-cyan-50 px-4 py-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">{ob.nextBest}</p>
      <h3 className="mt-1 text-xl font-black text-night">
        {hasAreas ? ob.feedReady : isPublisher ? o.feedReadyTeacher : ob.chooseInterests}
      </h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
        {hasAreas
          ? ob.jumpIntoSurface
          : isPublisher
            ? ob.teacherSetupDesc
            : ob.interestsUnlockDesc}
      </p>
      <div className="mt-4 zigo-action-grid">
        {actions.map((action) => (
          <Link
            className={`zigo-action-chip tap-scale rounded-lg ${
              action.primary ? "zigo-tab-active" : "bg-white text-slate-700"
            }`}
            href={hasAreas ? action.href : "/onboarding"}
            key={action.label}
          >
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

function getNextActions({
  hasAreas,
  isVerified,
  role,
  messages: m,
}: {
  hasAreas: boolean;
  isVerified: boolean;
  role: UserRole;
  messages: Messages;
}) {
  const ob = m.onboarding;
  const studioHref = role === "platform" ? "/platform" : "/teacher";

  if (!hasAreas) {
    if (role === "teacher" || role === "platform") {
      return [
        { href: studioHref, label: isVerified ? ob.actionStudio : ob.actionVerify, primary: true },
        { href: "/profile", label: ob.actionProfile },
        { href: "/", label: ob.actionFeed },
      ];
    }

    return [
      { href: "/onboarding", label: ob.actionAreas, primary: true },
      { href: "/setup", label: ob.actionSetup },
      { href: "/profile", label: ob.actionProfile },
    ];
  }

  if (role === "teacher" || role === "platform") {
    return [
      { href: isVerified ? "/create" : studioHref, label: isVerified ? ob.actionCreate : ob.actionVerify, primary: true },
      { href: "/micro", label: m.nav.micro },
      { href: "/questions", label: ob.actionQa },
    ];
  }

  if (role === "parent") {
    return [
      { href: "/family", label: ob.actionChild, primary: true },
      { href: "/", label: ob.actionFeed },
      { href: "/store", label: ob.actionRewards },
    ];
  }

  return [
    { href: "/micro", label: m.nav.micro, primary: true },
    { href: "/duels", label: ob.actionDuels },
    { href: "/avatar", label: ob.actionAvatar },
  ];
}

function TeacherPendingCard({ messages: m }: { messages: Messages }) {
  const ob = m.onboarding;

  return (
    <section className="-mx-4 bg-white px-6 py-10 text-center">
      <span className="mx-auto flex size-16 items-center justify-center rounded-full border-2 border-night text-night">
        <svg aria-hidden="true" className="size-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M12 3v18" />
          <path d="M5 8h14" />
          <path d="M7 16h10" />
        </svg>
      </span>
      <h3 className="mt-4 text-xl font-black text-night">{ob.verificationPending}</h3>
      <p className="mx-auto mt-2 max-w-72 text-sm leading-6 text-slate-500">{ob.verificationPendingDesc}</p>
      <Link className="tap-scale mt-5 inline-flex zigo-cta tap-scale rounded-lg px-5 py-3 text-sm font-black text-white" href="/teacher">
        {ob.openStudio}
      </Link>
    </section>
  );
}
