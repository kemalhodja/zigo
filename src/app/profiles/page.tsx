import Link from "next/link";

import { hasSupabaseEnv, withSupabaseFallback } from "@/lib/config";
import { isCurrentUserPlatformAdmin } from "@/lib/domain/admin";
import { getChildProfiles } from "@/lib/domain/children";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { getServerMessages, type Messages } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilesPage() {
  const m = await getServerMessages();
  const p = m.profilesPage;
  const profiles = await getProfiles(m);

  return (
    <div className="space-y-5 pb-3">
      <section className="-mx-4 border-b border-slate-200 bg-white px-4 pb-4">
        <p className="text-sm font-black text-slate-500">{p.eyebrow}</p>
        <h1 className="zigo-display mt-1 font-black leading-tight text-night">{p.title}</h1>
        <p className="mt-2 text-sm font-semibold text-slate-500">{p.subtitle}</p>
      </section>

      <section className="-mx-4 bg-white">
        {profiles.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <span className="mx-auto flex size-16 items-center justify-center rounded-lg border-2 border-night text-night">
              <svg aria-hidden="true" className="size-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M20 21a8 8 0 1 0-16 0" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <h2 className="mt-4 text-lg font-black text-night">{p.signInTitle}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{p.signInDesc}</p>
            <Link className="tap-scale mt-5 inline-flex zigo-cta tap-scale rounded-lg px-5 py-3 text-sm font-black text-white" href="/auth">
              {m.common.signIn}
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 px-4 py-4">
            {profiles.map((profile) => (
              <ProfileSwitchCard
                accent={profile.accent}
                chipFeed={p.chipFeed}
                chipProgress={p.chipProgress}
                chipRewards={p.chipRewards}
                href={profile.href}
                key={profile.id}
                subtitle={profile.subtitle}
                switchLabel={p.switch}
                title={profile.title}
              />
            ))}
          </div>
        )}
      </section>

      <section className="-mx-4 border-y border-violet-100 bg-gradient-to-r from-violet-50 via-pink-50 to-cyan-50 px-4 py-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">{p.familyBridge}</p>
        <h2 className="mt-1 text-xl font-black text-night">{p.familyTitle}</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{p.familyDesc}</p>
        <div className="zigo-dashboard-grid mt-4">
          <Link className="tap-scale zigo-mobile-card rounded-2xl bg-white text-center text-base font-black text-slate-700" href="/family">
            {p.familySetup}
          </Link>
          <Link className="tap-scale zigo-mobile-card rounded-2xl bg-white text-center text-base font-black text-slate-700" href="/student">
            {p.studentMode}
          </Link>
          <Link className="tap-scale zigo-mobile-cta rounded-2xl text-center" href="/">
            {p.continueFeed}
          </Link>
        </div>
      </section>

      <section className="zigo-dashboard-grid">
        <Link className="rounded-lg bg-slate-100 px-4 py-3 text-center text-sm font-black text-night" href="/onboarding">
          {p.editSetup}
        </Link>
        <Link className="zigo-cta tap-scale rounded-lg px-4 py-3 text-center text-sm font-black text-white" href="/">
          {p.continueFeed}
        </Link>
      </section>
    </div>
  );
}

function ProfileSwitchCard({
  accent,
  chipFeed,
  chipProgress,
  chipRewards,
  href,
  subtitle,
  switchLabel,
  title,
}: {
  accent: string;
  chipFeed: string;
  chipProgress: string;
  chipRewards: string;
  href: string;
  subtitle: string;
  switchLabel: string;
  title: string;
}) {
  return (
    <Link
      className={`tap-scale overflow-hidden rounded-lg bg-gradient-to-br ${accent} p-4 text-white`}
      href={href}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-lg border border-white/25 bg-white/18 text-xl font-black backdrop-blur">
            {title.slice(0, 2)}
          </span>
          <div className="min-w-0">
            <p className="zigo-fit-text text-lg font-black">{title}</p>
            <p className="zigo-fit-text mt-1 text-sm font-bold text-white/75">{subtitle}</p>
          </div>
        </div>
        <span className="rounded-lg bg-white px-3 py-2 text-xs font-black text-night">{switchLabel}</span>
      </div>
      <div className="zigo-action-grid mt-4">
        <span className="zigo-stat-chip rounded-lg bg-black/12 text-white backdrop-blur">{chipFeed}</span>
        <span className="zigo-stat-chip rounded-lg bg-black/12 text-white backdrop-blur">{chipProgress}</span>
        <span className="zigo-stat-chip rounded-lg bg-black/12 text-white backdrop-blur">{chipRewards}</span>
      </div>
    </Link>
  );
}

async function getProfiles(m: Messages) {
  const p = m.profilesPage;

  const previewProfiles = [
    {
      id: "student",
      title: p.previewStudent,
      subtitle: p.previewStudentSub,
      href: "/student",
      accent: "from-crystal to-fuchsia-500",
    },
    {
      id: "parent",
      title: p.previewParent,
      subtitle: p.previewParentSub,
      href: "/parent",
      accent: "from-slate-700 to-night",
    },
    {
      id: "teacher",
      title: p.previewTeacher,
      subtitle: p.previewTeacherSub,
      href: "/teacher",
      accent: "from-emerald-500 to-teal-500",
    },
  ];

  if (!hasSupabaseEnv()) return previewProfiles;

  return withSupabaseFallback(async () => {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) return [];

  const isPlatformAdmin = await isCurrentUserPlatformAdmin(supabase);
  const adminProfile = isPlatformAdmin
    ? [
        {
          id: "platform-admin",
          title: m.roles.platformAdmin,
          subtitle: m.ops.admin.desc,
          href: "/admin",
          accent: "from-night to-crystal",
        },
      ]
    : [];

  if (profile.role === "parent") {
    const children = await getChildProfiles(supabase);
    return [
      ...adminProfile,
      {
        id: profile.id,
        title: p.previewParent,
        subtitle: p.parentSubtitle,
        href: "/parent",
        accent: "from-slate-700 to-night",
      },
      ...children.map((child) => ({
        id: child.id,
        title: child.display_name,
        subtitle: p.pointsLabel.replace("{points}", String(child.total_points)),
        href: `/profiles/select/${child.id}?next=/student`,
        accent: "from-crystal to-fuchsia-500",
      })),
    ];
  }

  return [
    ...adminProfile,
    {
      id: profile.id,
      title: profile.full_name,
      subtitle:
        profile.role === "teacher" || profile.role === "platform"
          ? profile.is_verified
            ? p.verifiedStudio
            : p.verificationPending
          : p.pointsLabel.replace("{points}", String(profile.total_points)),
      href: profile.role === "platform" ? "/platform" : profile.role === "teacher" ? "/teacher" : "/student",
      accent: profile.role === "teacher" || profile.role === "platform" ? "from-emerald-500 to-teal-500" : "from-crystal to-fuchsia-500",
    },
  ];
  }, previewProfiles);
}
