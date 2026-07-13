import { redirect } from "next/navigation";

import { ProfileEditForm } from "@/components/profile-edit-form";
import { SupabaseSetupCard } from "@/components/supabase-setup-card";
import { hasSupabaseEnv, withSupabaseFallback } from "@/lib/config";
import { getCurrentProfile } from "@/lib/domain/profiles";
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

    const initialProfile = {
      fullName: profile.full_name,
      bio: profile.bio || "",
      avatarUrl: profile.avatar_url || null,
    };

    return (
      <div className="space-y-5 pb-3">
        <section className="-mx-4 border-b border-slate-100 bg-white px-4 pb-4">
          <h1 className="text-2xl font-black text-night">{pe.title}</h1>
        </section>
        <ProfileEditForm initialProfile={initialProfile} />
      </div>
    );
  }, <SupabaseSetupCard />);
}
