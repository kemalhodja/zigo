import { redirect } from "next/navigation";

import { hasSupabaseEnv } from "@/lib/config";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { getRoleDashboardHref } from "@/lib/domain/role-navigation";
import { createClient } from "@/lib/supabase/server";

/** Legacy Netflix-style mode switcher — single-role accounts go straight to their hub. */
export default async function ProfilesRedirectPage() {
  if (!hasSupabaseEnv()) {
    redirect("/auth");
  }

  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile) {
    redirect("/auth?next=/");
  }

  redirect(getRoleDashboardHref(profile.role));
}
