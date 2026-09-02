import Link from "next/link";

import { BackButton } from "@/components/back-button";
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
  searchParams: Promise<{ mode?: string; pack?: string }>;
};

export default async function CreatePage({ searchParams }: CreatePageProps) {
  const m = await getServerMessages();
  const params = await searchParams;
  const initialMode = resolveCreateMode(params.mode);
  const pack = params.pack === "micro-quiz" ? "micro-quiz" : null;
  const { areas, canCreate, lockReason, teacherCreatorPlus, allowDevActivate } = await getCreatePageData();

  if (!canCreate) {
    return <CreateLocked reason={lockReason} createPage={m.createPage} common={m.common} nav={m.nav} />;
  }

  return (
    <div className="space-y-0 pb-3">
      <section className="-mx-4 -mt-4 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
        <BackButton className="tap-scale flex size-9 items-center justify-center text-night" fallbackHref="/" />
        <h1 className="text-xl font-black text-night">{m.createStudio.title}</h1>
        <span className="w-9" />
      </section>

      {pack ? (
        <section className="-mx-4 border-b border-violet-100 bg-violet-50 px-4 py-3">
          <p className="text-sm font-black text-night">Adım: kısa ders, sonra quiz</p>
          <div className="mt-2 flex gap-2">
            <Link className="tap-scale rounded-lg bg-crystal px-3 py-2 text-xs font-black text-white" href="/create?mode=micro&pack=micro-quiz">
              Kısa ders
            </Link>
            <Link className="tap-scale rounded-lg bg-night px-3 py-2 text-xs font-black text-white" href="/teacher?pack=micro-quiz">
              Quiz
            </Link>
          </div>
        </section>
      ) : null}

      <CreateStudioHero areaCount={areas.length} createStudio={m.createStudio} initialMode={initialMode} />
      <CreateModeComposer
        allowDevActivate={allowDevActivate}
        areas={areas}
        initialMode={initialMode}
        teacherCreatorPlus={teacherCreatorPlus}
      />
      {!pack ? (
        <p className="-mx-4 border-t border-slate-100 bg-white px-4 py-3 text-center text-xs font-bold text-slate-500">
          İstersen{" "}
          <Link className="text-crystal" href="/create?mode=micro&pack=micro-quiz">
            kısa ders + quiz
          </Link>{" "}
          birlikte yayınla.
        </p>
      ) : null}
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
    { href: "/create", label: createStudio.post, value: "post" as const },
    { href: "/create?mode=micro", label: createStudio.micro, value: "reel" as const },
    { href: "/create?mode=spark", label: createStudio.spark, value: "story" as const },
  ];

  const modeLabel =
    initialMode === "reel"
      ? createStudio.micro
      : initialMode === "story"
        ? createStudio.spark
        : createStudio.post;

  return (
    <section className="-mx-4 border-b border-slate-100 bg-white">
      <div className="bg-gradient-to-br from-night via-violet-900 to-crystal px-4 py-4 text-white">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">{createStudio.creatorStudio}</p>
        <h2 className="mt-1.5 text-xl font-black leading-tight">{createStudio.publishFeed}</h2>
        <p className="mt-2 text-sm font-bold leading-6 text-white/80">{createStudio.publishDesc}</p>
        <p className="mt-3 text-xs font-black uppercase tracking-[0.14em] text-white/75">
          {modeLabel} · {areaCount} {createStudio.statAreas}
        </p>
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

type CreateLockReason = "areas" | "auth" | "not-teacher" | "not-premium" | "setup" | "unverified";

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

    const subscription = await getUserSubscription(supabase, profile.id);

    // Öğrenci ve Veliler Zigo Plus abonesi ise paylaşım yapabilir:
    if (profile.role === "student" || profile.role === "parent") {
      if (!subscription.isPremium) {
        return {
          areas: [],
          canCreate: false,
          lockReason: "not-premium",
          teacherCreatorPlus: false,
          allowDevActivate: canUseDevBillingBypass(),
        };
      }

      const [areas, userAreaIds] = await Promise.all([
        getEducationAreas(supabase),
        getUserInterestAreaIds(supabase, profile.id),
      ]);
      const allowedAreas = userAreaIds.length > 0
        ? areas.filter((area) => userAreaIds.includes(area.id))
        : areas; // İlgi alanı seçilmemişse tüm alanları kullanabilir

      return {
        areas: allowedAreas,
        canCreate: allowedAreas.length > 0,
        lockReason: allowedAreas.length > 0 ? undefined : "areas",
        teacherCreatorPlus: false,
        allowDevActivate: canUseDevBillingBypass(),
      };
    }

    // Kurumsal ve platform rolleri
    const isInstitution = ["education_institution", "education_platform", "publisher"].includes(profile.role);
    if (isInstitution) {
      const areas = await getEducationAreas(supabase);
      return {
        areas,
        canCreate: true,
        teacherCreatorPlus: true,
        allowDevActivate: canUseDevBillingBypass(),
      };
    }

    // Öğretmen kontrolü
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

    const [areas, teacherAreaIds] = await Promise.all([
      getEducationAreas(supabase),
      getUserInterestAreaIds(supabase, profile.id),
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
      action: nav.home,
      description: c.notTeacherDesc,
      href: "/",
      title: c.notTeacherTitle,
    },
    "not-premium": {
      action: "Zigo Plus'a Geç ✨",
      description: "Öğrenciler ve Veliler yalnızca aktif Zigo Plus aboneliği ile gönderi ve ders notu paylaşabilir (Günde 2 paylaşım).",
      href: "/pricing",
      title: "Zigo Plus ile Paylaşım Yapın",
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
