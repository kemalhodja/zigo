import type { SupabaseClient, User } from "@supabase/supabase-js";
import { NextResponse, type NextResponse as NextResponseType } from "next/server";

import { jsonError } from "@/features/shared/errors/global-error-handler";
import { getCurrentProfile, type UserProfile } from "@/lib/domain/profiles";
import type { Database, UserRole } from "@/lib/supabase/database.types";

type RequireProfileOptions = {
  roles?: UserRole[];
  excludeRoles?: UserRole[];
  requireVerified?: boolean;
};

export function isErrorResponse(value: unknown): value is NextResponseType {
  return value instanceof NextResponse;
}

export async function requireAuthUser(
  supabase: SupabaseClient<Database>,
): Promise<User | NextResponseType> {
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
): Promise<UserProfile | NextResponseType> {
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
