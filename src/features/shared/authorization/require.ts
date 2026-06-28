import type { SupabaseClient, User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { jsonError } from "@/features/shared/errors/global-error-handler";
import { isCurrentUserPlatformAdmin } from "@/lib/domain/admin";
import { getCurrentProfile, getUserInterestAreaIds, type UserProfile } from "@/lib/domain/profiles";
import { isVerifiedPublisher } from "@/lib/domain/role-utils";
import type { Database } from "@/lib/supabase/database.types";

import { isApiRoleAllowed } from "./api-prefix-rules";
import { evaluateCapability } from "./capabilities";
import type {
  AuthContext,
  AuthorizeRequestOptions,
  AuthzDecision,
  RequireProfileOptions,
} from "./types";

export function isErrorResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}

export function decisionToResponse(decision: AuthzDecision): NextResponse | null {
  if (decision.allowed) return null;
  const status = decision.code === "UNAUTHORIZED" ? 401 : decision.code === "NOT_FOUND" ? 404 : 403;
  return jsonError(decision.message, status, decision.code);
}

export function profileToAuthContext(
  profile: UserProfile,
  options: {
    areaIds?: number[];
    isPlatformAdmin?: boolean;
  } = {},
): AuthContext {
  return {
    userId: profile.id,
    profile,
    role: profile.role,
    areaIds: options.areaIds ?? [],
    isPlatformAdmin: options.isPlatformAdmin ?? false,
    isVerifiedTeacher: isVerifiedPublisher(profile),
  };
}

export async function buildAuthContext(
  supabase: SupabaseClient<Database>,
  profile: UserProfile,
  options: { loadAreaIds?: boolean; loadPlatformAdmin?: boolean } = {},
): Promise<AuthContext> {
  const [areaIds, isPlatformAdmin] = await Promise.all([
    options.loadAreaIds === false
      ? Promise.resolve([] as number[])
      : getUserInterestAreaIds(supabase, profile.id),
    options.loadPlatformAdmin === false
      ? Promise.resolve(false)
      : isCurrentUserPlatformAdmin(supabase),
  ]);

  return profileToAuthContext(profile, { areaIds, isPlatformAdmin });
}

export async function requireAuthUser(
  supabase: SupabaseClient<Database>,
): Promise<User | NextResponse> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("Unauthorized", 401, "UNAUTHORIZED");
  }

  return user;
}

export async function requireAuthenticatedProfile(
  supabase: SupabaseClient<Database>,
  options: RequireProfileOptions = {},
): Promise<UserProfile | NextResponse> {
  const profile = await getCurrentProfile(supabase);
  if (!profile) {
    return jsonError("Unauthorized", 401, "UNAUTHORIZED");
  }

  if (options.excludeRoles?.includes(profile.role)) {
    return jsonError("Forbidden", 403, "FORBIDDEN");
  }

  if (options.roles && !options.roles.includes(profile.role)) {
    return jsonError("Forbidden", 403, "FORBIDDEN");
  }

  if (options.requireVerified && !profile.is_verified) {
    return jsonError("Verified teacher required.", 403, "FORBIDDEN");
  }

  return profile;
}

export async function requirePlatformAdminContext(
  supabase: SupabaseClient<Database>,
): Promise<AuthContext | NextResponse> {
  const profileOrError = await requireAuthenticatedProfile(supabase);
  if (isErrorResponse(profileOrError)) return profileOrError;

  const isPlatformAdmin = await isCurrentUserPlatformAdmin(supabase);
  if (!isPlatformAdmin) {
    return jsonError("Platform admin access is required.", 403, "FORBIDDEN");
  }

  return profileToAuthContext(profileOrError, { isPlatformAdmin: true });
}

export async function authorizeRequest(
  supabase: SupabaseClient<Database>,
  request: Request,
  options: AuthorizeRequestOptions = {},
): Promise<AuthContext | NextResponse> {
  const profileOrError = await requireAuthenticatedProfile(supabase, options);
  if (isErrorResponse(profileOrError)) return profileOrError;

  if (options.requirePlatformAdmin) {
    const adminContext = await requirePlatformAdminContext(supabase);
    return adminContext;
  }

  const authContext = await buildAuthContext(supabase, profileOrError, {
    loadAreaIds: !options.skipAreaIds,
    loadPlatformAdmin: options.enforceApiPrefixRule !== false || options.capability === "admin:platform",
  });

  if (options.enforceApiPrefixRule !== false) {
    const pathname = new URL(request.url).pathname;
    if (!isApiRoleAllowed(pathname, authContext.role, authContext.isPlatformAdmin)) {
      return jsonError("Forbidden", 403, "FORBIDDEN");
    }
  }

  if (options.capability) {
    const decision = evaluateCapability(authContext, options.capability);
    const response = decisionToResponse(decision);
    if (response) return response;
  }

  return authContext;
}

export function assertAuthzDecision(decision: AuthzDecision): NextResponse | null {
  return decisionToResponse(decision);
}
