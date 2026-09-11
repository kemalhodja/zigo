import { cache } from "react";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export const getCachedUserProfile = cache(async () => {
  const supabase = await createClient();
  return getCurrentProfile(supabase);
});

export const getCachedProfileById = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("id, role, grade_level, district")
    .eq("id", userId)
    .maybeSingle();

  if (!data) return null;
  return {
    ...data,
    city: ((data as unknown as Record<string, unknown>).city as string | null) ?? null,
  };
});
