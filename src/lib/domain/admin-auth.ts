import { isErrorResponse } from "@/features/shared/api/require-auth";
import { requirePlatformAdminAccess } from "@/features/shared/api/rbac";
import { createClient } from "@/lib/supabase/server";

/** @deprecated Prefer `withAdminApiHandler` or `requirePlatformAdminAccess` from `@/features/shared/api/rbac`. */
export async function requirePlatformAdmin() {
  const supabase = await createClient();
  const result = await requirePlatformAdminAccess(supabase);

  if (isErrorResponse(result)) {
    return { error: result, supabase };
  }

  return { profile: result.profile, supabase: result.supabase };
}
