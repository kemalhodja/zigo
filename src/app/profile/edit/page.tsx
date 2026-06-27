import Link from "next/link";

import { ExpertiseMatrixForm } from "@/components/expertise-matrix-form";
import { ProfessionalProfileWizard } from "@/components/professional-profile-wizard";
import { StateCard } from "@/components/state-card";
import { hasSupabaseEnv } from "@/lib/config";
import { getTeacherExpertiseMatrix } from "@/lib/domain/platform-activity";
import { getProfessionalProfileBundle, resolveProfessionalProfileKind } from "@/lib/domain/professional-profile";
import { getCurrentProfile, parseOrganizationType } from "@/lib/domain/profiles";
import { getServerMessages } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export default async function ProfileEditPage() {
  const m = await getServerMessages();

  if (!hasSupabaseEnv()) {
    return (
      <StateCard
        action={
          <Link className="font-black text-crystal" href="/setup">
            {m.common.setup}
          </Link>
        }
        description="Profil düzenleme için Supabase bağlantısı gerekir."
        title="Kurulum gerekli"
      />
    );
  }

  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile) {
    return (
      <StateCard
        action={
          <Link className="font-black text-crystal" href="/auth?next=/profile/edit">
            {m.common.signIn}
          </Link>
        }
        description="Profilinizi düzenlemek için giriş yapın."
        title="Oturum gerekli"
      />
    );
  }

  const kind = resolveProfessionalProfileKind(profile);

  if (!kind) {
    return (
      <div className="space-y-5">
        <section className="-mx-4 border-b border-slate-100 bg-white px-4 pb-4">
          <Link className="text-xs font-black text-crystal" href="/profile">
            ← Profile dön
          </Link>
          <h2 className="mt-2 text-2xl font-black text-night">Profil düzenle</h2>
          <p className="mt-2 text-sm text-slate-500">
            Öğrenci ve veli hesapları için temel profil ayarları onboarding sayfasındadır.
          </p>
        </section>
        <StateCard
          action={
            <Link className="font-black text-crystal" href="/onboarding">
              Onboarding&apos;e git
            </Link>
          }
          description="Sınıf, hedef sınav ve ilgi alanlarınızı güncelleyin."
          title={profile.full_name}
        />
      </div>
    );
  }

  const bundle = await getProfessionalProfileBundle(supabase, profile);
  const expertise =
    kind === "teacher" ? await getTeacherExpertiseMatrix(supabase, profile.id) : [];

  return (
    <div className="space-y-5">
      <ProfessionalProfileWizard
        initial={{
          kind,
          fullName: profile.full_name,
          bio: profile.bio,
          avatarUrl: profile.avatar_url,
          organizationType: parseOrganizationType(profile.organization_type),
          teacher: bundle.teacher,
          institution: bundle.institution,
          platform: bundle.platform,
        }}
      />
      {kind === "teacher" ? <ExpertiseMatrixForm initialSlugs={expertise.map((row) => row.track_slug)} /> : null}
    </div>
  );
}
