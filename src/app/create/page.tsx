import Link from "next/link";

import { type ComposerArea,CreateModeComposer } from "@/components/create-mode-composer";
import { hasSupabaseEnv, withSupabaseFallback } from "@/lib/config";
import { canUseDevBillingBypass } from "@/lib/domain/billing";
import { getCurrentProfile, getEducationAreas, getUserInterestAreaIds } from "@/lib/domain/profiles";
import { getUserSubscription } from "@/lib/domain/subscription";
import { canTeacherUseCreatorPlusTools } from "@/lib/domain/teacher-creator-plus";
import { getServerMessages, type Messages } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

const demoAreas: ComposerArea[] = [
  { id: 1, area_name: "LGS Matematik", age_group: "5-8. Sınıf" },
  { id: 2, area_name: "LGS Fen Bilimleri", age_group: "5-8. Sınıf" },
  { id: 3, area_name: "5-8. Sınıf İngilizce", age_group: "5-8. Sınıf" },
  { id: 4, area_name: "Ortaokul Kodlama", age_group: "5-8. Sınıf" },
  { id: 5, area_name: "1-4. Sınıf Türkçe", age_group: "1-4. Sınıf" },
  { id: 6, area_name: "YKS Fizik", age_group: "9-12. Sınıf" },
];

type CreatePageProps = {
  searchParams: Promise<{ mode?: string }>;
};

export default async function CreatePage({ searchParams }: CreatePageProps) {
  const m = await getServerMessages();
  const params = await searchParams;
  const initialMode = resolveCreateMode(params.mode);
  const { areas, canCreate, lockReason, teacherCreatorPlus, allowDevActivate } = await getCreatePageData();

  if (!canCreate) {
    return <CreateLocked reason={lockReason} createPage={m.createPage} common={m.common} nav={m.nav} />;
  }

  return (
    <div className="space-y-0 pb-3">
      <section className="-mx-4 -mt-4 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
        <Link className="tap-scale flex size-9 items-center justify-center text-night" href="/">
          <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <h1 className="text-xl font-black text-night">{m.createStudio.title}</h1>
        <span className="w-9" />
      </section>

      <CreateStudioHero areaCount={areas.length} createStudio={m.createStudio} initialMode={initialMode} />
      <CreateModeComposer
        allowDevActivate={allowDevActivate}
        areas={areas}
        initialMode={initialMode}
        teacherCreatorPlus={teacherCreatorPlus}
      />
      <CreatePublishSafetyLane createStudio={m.createStudio} />
    </div>
  );
}

function CreateStudioHero({
  areaCount,
  createStudio,
  initialMode,
}: {
  areaCount: number;
  createStudio: Messages["createStudio"];
  initialMode: "post" | "reel" | "story";
}) {
  const studioModes = [
    { href: "/create", label: createStudio.post, value: "post" },
    { href: "/create?mode=micro", label: createStudio.micro, value: "reel" },
    { href: "/create?mode=spark", label: createStudio.spark, value: "story" },
  ] as const;

  return (
    <section className="-mx-4 border-b border-slate-100 bg-white">
      <div className="bg-gradient-to-br from-night via-violet-900 to-crystal px-4 py-4 text-white">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">{createStudio.creatorStudio}</p>
        <h2 className="mt-1.5 text-xl font-black leading-tight">{createStudio.publishFeed}</h2>
        <p className="mt-2 text-sm font-bold leading-6 text-white/80">
          {createStudio.publishDesc}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <StudioStat label={createStudio.statAreas} value={areaCount} />
          <StudioStat label={createStudio.statMode} value={initialMode} />
          <StudioStat label={createStudio.statSafety} value="RLS" />
        </div>
      </div>
      <div className="zigo-action-grid px-4 py-3">
        {studioModes.map((mode) => {
          const isActive = mode.value === initialMode;
          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={`zigo-action-chip tap-scale rounded-xl ${
                isActive ? "zigo-tab-active shadow-sm" : "border border-slate-200 bg-white text-slate-600"
              }`}
              href={mode.href}
              key={mode.value}
            >
              {mode.label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function StudioStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl bg-white/14 px-2 py-2 backdrop-blur">
      <p className="zigo-fit-text text-sm font-black">{value}</p>
      <p className="mt-0.5 text-[0.65rem] font-black uppercase tracking-[0.1em] text-white/70">{label}</p>
    </div>
  );
}

function CreatePublishSafetyLane({ createStudio }: { createStudio: Messages["createStudio"] }) {
  const steps = [
    createStudio.verifiedTeacher,
    createStudio.matchFeedArea,
    createStudio.mediaCleaned,
    createStudio.studentSafe,
  ];

  return (
    <section className="-mx-4 border-t border-slate-100 bg-slate-50 px-4 py-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">{createStudio.safetyLane}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {steps.map((step) => (
          <div className="rounded-xl bg-white px-3 py-3 shadow-sm" key={step}>
            <span className="flex size-7 items-center justify-center rounded-lg bg-crystal text-white">
              <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path d="m5 12 4 4L19 6" />
              </svg>
            </span>
            <p className="mt-2 text-xs font-black text-night">{step}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

type CreateLockReason = "areas" | "auth" | "not-teacher" | "setup" | "unverified";

async function getCreatePageData(): Promise<{
  areas: ComposerArea[];
  canCreate: boolean;
  lockReason?: CreateLockReason;
  teacherCreatorPlus: boolean;
  allowDevActivate: boolean;
}> {
  if (!hasSupabaseEnv()) {
    return {
      areas: demoAreas,
      canCreate: false,
      lockReason: "setup",
      teacherCreatorPlus: false,
      allowDevActivate: canUseDevBillingBypass(),
    };
  }

  const previewFallback: Awaited<ReturnType<typeof getCreatePageData>> = {
    areas: demoAreas,
    canCreate: false,
    lockReason: "setup" as const,
    teacherCreatorPlus: false,
    allowDevActivate: canUseDevBillingBypass(),
  };

  return withSupabaseFallback(async () => {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return {
        areas: [],
        canCreate: false,
        lockReason: "auth",
        teacherCreatorPlus: false,
        allowDevActivate: false,
      };
    }

    if (profile.role !== "teacher") {
      return {
        areas: [],
        canCreate: false,
        lockReason: "not-teacher",
        teacherCreatorPlus: false,
        allowDevActivate: false,
      };
    }

    if (!profile.is_verified) {
      return {
        areas: [],
        canCreate: false,
        lockReason: "unverified",
        teacherCreatorPlus: false,
        allowDevActivate: false,
      };
    }

    const [areas, teacherAreaIds, subscription] = await Promise.all([
      getEducationAreas(supabase),
      getUserInterestAreaIds(supabase, profile.id),
      getUserSubscription(supabase, profile.id),
    ]);
    const allowedAreas = areas.filter((area) => teacherAreaIds.includes(area.id));

    return {
      areas: allowedAreas,
      canCreate: allowedAreas.length > 0,
      lockReason: allowedAreas.length > 0 ? undefined : "areas",
      teacherCreatorPlus: canTeacherUseCreatorPlusTools(subscription, profile.role),
      allowDevActivate: canUseDevBillingBypass(),
    };
  }, previewFallback);
}

const createLockedCopy = (c: Messages["createPage"], common: Messages["common"], nav: Messages["nav"]) =>
  ({
    areas: {
      action: c.chooseAreas,
      description: c.chooseAreasDesc,
      href: "/onboarding",
      title: c.chooseAreas,
    },
    auth: {
      action: common.signIn,
      description: c.signInDesc,
      href: "/auth",
      title: c.signInTitle,
    },
    "not-teacher": {
      action: nav.ask,
      description: c.notTeacherDesc,
      href: "/questions",
      title: c.notTeacherTitle,
    },
    setup: {
      action: common.setup,
      description: c.setupDesc,
      href: "/setup",
      title: c.setupTitle,
    },
    unverified: {
      action: c.openProfile,
      description: c.unverifiedDesc,
      href: "/teacher",
      title: c.unverifiedTitle,
    },
  }) as const;

function CreateLocked({
  reason = "not-teacher",
  createPage,
  common,
  nav,
}: {
  reason?: CreateLockReason;
  createPage: Messages["createPage"];
  common: Messages["common"];
  nav: Messages["nav"];
}) {
  const copy = createLockedCopy(createPage, common, nav)[reason];

  return (
    <div className="space-y-0 pb-3">
      <section className="-mx-4 -mt-3 border-b border-slate-100 bg-white px-4 py-3">
        <h1 className="text-xl font-black text-night">{createPage.lockedTitle}</h1>
      </section>
      <section className="-mx-4 border-b border-slate-100 bg-white px-6 py-8 text-center">
        <p className="sr-only">{createPage.studioLockedSrOnly}</p>
        <span className="mx-auto flex size-16 items-center justify-center rounded-full border-2 border-night text-night">
          <svg aria-hidden="true" className="size-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect height="18" rx="5" width="18" x="3" y="3" />
            <path d="M12 8v8" />
            <path d="M8 12h8" />
          </svg>
        </span>
        <h2 className="mt-4 text-2xl font-black leading-tight text-night">{createPage.lockedTitle}</h2>
        <p className="mx-auto mt-2 max-w-64 text-sm font-semibold leading-6 text-slate-500">
          {createPage.lockedDesc}
        </p>
      </section>
      <section className="-mx-4 px-6 py-8 text-center">
        <h2 className="text-xl font-black leading-tight text-night">{copy.title}</h2>
        <p className="mx-auto mt-2 max-w-64 text-sm leading-6 text-slate-500">
          {copy.description}
        </p>
        <Link className="tap-scale mt-5 inline-flex zigo-cta tap-scale rounded-lg px-5 py-3 text-sm font-black text-white" href={copy.href}>
          {copy.action}
        </Link>
      </section>
    </div>
  );
}

function resolveCreateMode(mode?: string): "post" | "reel" | "story" {
  if (mode === "story" || mode === "spark") return "story";
  if (mode === "reel" || mode === "micro") return "reel";
  return "post";
}
