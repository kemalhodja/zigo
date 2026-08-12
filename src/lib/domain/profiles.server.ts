import { cache } from "react";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export const getCachedUserProfile = cache(async () => {
  const supabase = await createClient();
  return getCurrentProfile(supabase);
});
