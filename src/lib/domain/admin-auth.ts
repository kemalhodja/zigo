import { NextResponse } from "next/server";

import { isCurrentUserPlatformAdmin } from "@/lib/domain/admin";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export async function requirePlatformAdmin() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      supabase,
    };
  }

  const isAdmin = await isCurrentUserPlatformAdmin(supabase);

  if (!isAdmin) {
    return {
      error: NextResponse.json({ error: "Platform admin access is required." }, { status: 403 }),
      supabase,
    };
  }

  return { profile, supabase };
}
