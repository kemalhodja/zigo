import type { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { isErrorResponse, requireAuthenticatedProfile } from "@/features/shared/api/require-auth";
import { jsonError } from "@/features/shared/errors/global-error-handler";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { isCurrentUserPlatformAdmin } from "@/lib/domain/admin";
import type { UserProfile } from "@/lib/domain/profiles";
import type { Database, UserRole } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type AuthenticatedAdminContext = {
  supabase: SupabaseClient<Database>;
  profile: UserProfile;
};

export type ApiRbacPrefixRule = {
  prefix: string;
  roles?: UserRole[];
  excludeRoles?: UserRole[];
  requirePlatformAdmin?: boolean;
};

/** Documented API prefix RBAC — enforce in route handlers via helpers below. */
export const API_RBAC_PREFIX_RULES: ApiRbacPrefixRule[] = [
  { prefix: "/api/admin", requirePlatformAdmin: true },
  { prefix: "/api/ecosystem/bookings", roles: ["parent", "teacher"] },
  { prefix: "/api/ecosystem/availability", roles: ["parent", "teacher"] },
  { prefix: "/api/ecosystem/matching", roles: ["parent", "student", "teacher"] },
  { prefix: "/api/ecosystem/progress/weekly", roles: ["parent"] },
  { prefix: "/api/questions", roles: ["parent", "student", "teacher"] },
  { prefix: "/api/answers", roles: ["teacher"] },
  { prefix: "/api/learn", excludeRoles: ["teacher"] },
  { prefix: "/api/quizzes", roles: ["teacher"] },
  { prefix: "/api/notifications", roles: ["parent", "student", "teacher"] },
  { prefix: "/api/lesson-requests", excludeRoles: ["student"] },
  { prefix: "/api/lessons/request", excludeRoles: ["student"] },
];

export function getApiRbacRule(pathname: string): ApiRbacPrefixRule | null {
  for (const rule of API_RBAC_PREFIX_RULES) {
    if (pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)) {
      return rule;
    }
  }
  return null;
}

export function isApiRoleAllowed(
  pathname: string,
  role: UserRole,
  isPlatformAdmin: boolean,
): boolean {
  const rule = getApiRbacRule(pathname);
  if (!rule) return true;
  if (rule.requirePlatformAdmin) return isPlatformAdmin;
  if (rule.excludeRoles?.includes(role)) return false;
  if (rule.roles && !rule.roles.includes(role)) return false;
  return true;
}

export async function requirePlatformAdminAccess(
  supabase: SupabaseClient<Database>,
): Promise<AuthenticatedAdminContext | NextResponse> {
  const profileOrError = await requireAuthenticatedProfile(supabase);
  if (isErrorResponse(profileOrError)) return profileOrError;

  const isAdmin = await isCurrentUserPlatformAdmin(supabase);
  if (!isAdmin) {
    return jsonError("Platform admin access is required.", 403, "FORBIDDEN");
  }

  return { supabase, profile: profileOrError };
}

export function withAdminApiHandler<TContext = unknown>(
  handler: (
    request: Request,
    context: TContext,
    auth: AuthenticatedAdminContext,
  ) => Promise<NextResponse> | NextResponse,
  options?: { fallbackMessage?: string; fallbackStatus?: number },
) {
  return withApiHandler<TContext>(async (request, context) => {
    const supabase = await createClient();
    const authOrError = await requirePlatformAdminAccess(supabase);
    if (isErrorResponse(authOrError)) return authOrError;
    return handler(request, context, authOrError);
  }, options);
}
