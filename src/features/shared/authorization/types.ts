import type { UserProfile } from "@/lib/domain/profiles";
import type { UserRole } from "@/lib/supabase/database.types";

export type AuthzErrorCode = "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND";

export type AuthzDecision =
  | { allowed: true }
  | { allowed: false; message: string; code: AuthzErrorCode };

export type AuthContext = {
  userId: string;
  profile: UserProfile;
  role: UserRole;
  areaIds: number[];
  isPlatformAdmin: boolean;
  isVerifiedTeacher: boolean;
};

export type RequireProfileOptions = {
  roles?: UserRole[];
  excludeRoles?: UserRole[];
  requireVerified?: boolean;
};

export type AuthorizeRequestOptions = RequireProfileOptions & {
  requirePlatformAdmin?: boolean;
  capability?: ZigoCapability;
  /** When true (default), applies documented API prefix RBAC from the request URL. */
  enforceApiPrefixRule?: boolean;
  /** Skip loading user_interests area ids when not needed. */
  skipAreaIds?: boolean;
};

/** Declarative Zigo product capabilities (mirrors RLS + blueprint rules). */
export type ZigoCapability =
  | "feed:read_matched"
  | "post:create"
  | "question:create"
  | "answer:create"
  | "learn:access"
  | "quiz:author"
  | "lesson_request:create"
  | "lesson_request:respond"
  | "ecosystem:book"
  | "ecosystem:availability"
  | "parent:weekly_progress"
  | "child:manage"
  | "avatar:customize"
  | "notifications:read"
  | "admin:platform";

export type ApiRbacPrefixRule = {
  prefix: string;
  roles?: UserRole[];
  excludeRoles?: UserRole[];
  requirePlatformAdmin?: boolean;
};

export type RolePathRule = {
  prefix: string;
  roles: UserRole[];
};
