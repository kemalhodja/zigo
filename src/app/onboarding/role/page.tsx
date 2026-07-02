import Link from "next/link";
import { redirect } from "next/navigation";

import { RoleSelectionPanel } from "@/components/role-selection-panel";
import { SignOutButton } from "@/components/sign-out-button";
import { StateCard } from "@/components/state-card";
import { hasSupabaseEnv } from "@/lib/config";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { getServerMessages } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export default async function RoleSelectionPage() {
  const m = await getServerMessages();
  const rs = m.roleSelection;

  if (!hasSupabaseEnv()) {
    return <StateCard description={rs.needsSupabaseDesc} title={rs.needsSupabaseTitle} />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <StateCard
        action={
          <Link className="font-black text-crystal" href="/auth?next=/onboarding/role">
            {m.ops.common.signIn}
          </Link>
        }
        description={rs.signInDesc}
        title={rs.signInTitle}
      />
    );
  }

  const profile = await getCurrentProfile(supabase);
  if (profile?.role_selection_completed !== false) {
    redirect("/onboarding");
  }

  return (
    <div className="space-y-5 pb-4">
      <section className="-mx-4 border-b border-slate-100 bg-white px-4 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{m.onboardingPage.step1}</p>
          </div>
          <SignOutButton variant="icon" />
        </div>
      </section>
      <section className="-mx-4 bg-white px-4 py-4">
        <RoleSelectionPanel />
      </section>
    </div>
  );
}
