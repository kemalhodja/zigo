export {
  API_RBAC_PREFIX_RULES,
  getApiRbacRule,
  isApiRoleAllowed,
} from "@/features/shared/authorization/api-prefix-rules";
export type { AuthenticatedAdminContext } from "@/features/shared/authorization/handlers";
export {
  withAdminApiHandler,
  withAuthorizedApiHandler,
} from "@/features/shared/authorization/handlers";
export {
  authorizeRequest,
  isErrorResponse,
  requireAuthenticatedProfile,
  requirePlatformAdminContext,
} from "@/features/shared/authorization/require";
export type { ApiRbacPrefixRule } from "@/features/shared/authorization/types";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { NextResponse } from "next/server";

import type { AuthenticatedAdminContext } from "@/features/shared/authorization/handlers";
import {
  isErrorResponse,
  requirePlatformAdminContext,
} from "@/features/shared/authorization/require";
import type { Database } from "@/lib/supabase/database.types";

/** @deprecated Use `requirePlatformAdminContext` from `@/features/shared/authorization`. */
export async function requirePlatformAdminAccess(
  supabase: SupabaseClient<Database>,
): Promise<AuthenticatedAdminContext | NextResponse> {
  const authOrError = await requirePlatformAdminContext(supabase);
  if (isErrorResponse(authOrError)) return authOrError;

  return {
    supabase,
    profile: authOrError.profile,
    auth: authOrError,
  };
}
