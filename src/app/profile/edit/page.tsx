import Link from "next/link";
import { redirect } from "next/navigation";

import { GradeLevelForm } from "@/components/grade-level-form";
import { InterestSelector } from "@/components/interest-selector";
import { ProfileEditForm } from "@/components/profile-edit-form";
import { SupabaseSetupCard } from "@/components/supabase-setup-card";
import { hasSupabaseEnv, withSupabaseFallback } from "@/lib/config";
import {
  getCurrentProfile,
  getEducationAreas,
  getUserInterestAreaIds,
  parseOrganizationType,
} from "@/lib/domain/profiles";
import { resolveAccountKindFromProfile } from "@/lib/domain/registration-account";
import { getServerMessages } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export default async function ProfileEditPage() {
  const m = await getServerMessages();
  const pe = m.profileEdit;

  if (!hasSupabaseEnv()) {
    return <SupabaseSetupCard />;
  }

  return withSupabaseFallback(async () => {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      redirect("/auth");
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const [areas, selectedAreaIds] = await Promise.all([
      getEducationAreas(supabase),
      getUserInterestAreaIds(supabase, profile.id),
    ]);

    const organizationType = parseOrganizationType(profile.organization_type);
    const accountKind = resolveAccountKindFromProfile({
      role: profile.role,
      organizationType,
    });
    const showLearnerSetup = profile.role === "student" || profile.role === "parent";

    return (
      <div className="space-y-5 pb-6">
        <section className="-mx-4 border-b border-slate-100 bg-white px-4 pb-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">{pe.eyebrow}</p>
          <h1 className="mt-1 text-2xl font-black text-night">{pe.title}</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{pe.subtitle}</p>
        </section>

        <ProfileEditForm
          initialProfile={{
            fullName: profile.full_name,
            bio: profile.bio || "",
            websiteUrl: profile.website_url || null,
            avatarUrl: profile.avatar_url || null,
            email: user?.email ?? null,
            role: profile.role,
            accountKind,
          }}
        />

        {showLearnerSetup ? (
          <>
            <GradeLevelForm
              description={pe.gradeDesc}
              initialGradeLevel={profile.grade_level}
              title={pe.gradeTitle}
            />
            <section className="-mx-4 space-y-2 border-y border-slate-100 bg-white px-4 py-4">
              <h2 className="text-lg font-black text-night">{pe.interestsTitle}</h2>
              <p className="text-sm font-semibold text-slate-500">{pe.interestsDesc}</p>
              <InterestSelector
                areas={areas}
                gradeLevel={profile.grade_level}
                initialOrganizationType={organizationType}
                initialSelectedAreaIds={selectedAreaIds}
                multiple
                role={profile.role}
              />
            </section>
          </>
        ) : (
          <section className="-mx-4 space-y-3 border-y border-violet-100 bg-white px-4 py-4">
            <div>
              <h2 className="text-lg font-black text-night">{pe.interestsTitle}</h2>
              <p className="text-sm font-semibold text-slate-500">
                Keşfet ve akışınızı özelleştirecek genel ilgi ve uzmanlık alanlarınızı seçin. (Resmi akademik branşlarınız admin tarafından onaylanır.)
              </p>
            </div>
            <InterestSelector
              areas={areas}
              gradeLevel={profile.grade_level}
              initialOrganizationType={organizationType}
              initialSelectedAreaIds={selectedAreaIds}
              multiple
              role={profile.role}
            />
            <div className="mt-4 rounded-xl bg-violet-50 p-3">
              <h3 className="text-xs font-black text-crystal uppercase tracking-wider">{pe.teacherAreasTitle}</h3>
              <p className="mt-1 text-xs font-semibold text-slate-600 leading-5">{pe.teacherAreasDesc}</p>
              <Link
                className="tap-scale mt-2 inline-flex rounded-lg bg-night px-3.5 py-2 text-xs font-black text-white"
                href="/onboarding/role-setup"
              >
                {pe.openRoleSetup}
              </Link>
            </div>
          </section>
        )}
      </div>
    );
  }, <SupabaseSetupCard />);
}
