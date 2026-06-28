import type { UserRole } from "@/lib/supabase/database.types";

import type { ApiRbacPrefixRule } from "./types";

/** Documented API prefix RBAC — enforced via `authorizeRequest` and route helpers. */
export const API_RBAC_PREFIX_RULES: readonly ApiRbacPrefixRule[] = [
  { prefix: "/api/admin", requirePlatformAdmin: true },
  { prefix: "/api/ecosystem/bookings", roles: ["parent", "teacher", "platform"] },
  { prefix: "/api/ecosystem/availability", roles: ["parent", "teacher", "platform"] },
  { prefix: "/api/ecosystem/matching", roles: ["parent", "student", "teacher", "platform"] },
  { prefix: "/api/ecosystem/progress/weekly", roles: ["parent"] },
  { prefix: "/api/questions", roles: ["parent", "student", "teacher", "platform"] },
  { prefix: "/api/answers", roles: ["teacher", "platform"] },
  { prefix: "/api/learn", excludeRoles: ["teacher", "platform"] },
  { prefix: "/api/quizzes", roles: ["teacher", "platform"] },
  { prefix: "/api/notifications", roles: ["parent", "student", "teacher", "platform"] },
  { prefix: "/api/lesson-requests", excludeRoles: ["student"] },
  { prefix: "/api/lessons/request", excludeRoles: ["student"] },
] as const;

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
