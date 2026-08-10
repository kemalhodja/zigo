import { redirect } from "next/navigation";

import { hasSupabaseEnv } from "@/lib/config";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { getRoleDashboardHref } from "@/lib/domain/role-navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilesPage() {
  if (!hasSupabaseEnv()) {
    redirect("/auth");
  }

  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile) {
    redirect("/auth?next=/");
  }

  return redirect(getRoleDashboardHref(profile.role));
}
