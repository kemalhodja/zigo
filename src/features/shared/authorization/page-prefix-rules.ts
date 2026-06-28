import { getRoleDashboardHref } from "@/lib/domain/role-navigation";
import type { UserRole } from "@/lib/supabase/database.types";

import type { RolePathRule } from "./types";

export const AUTH_LOGIN_PATH = "/auth";

export const ADMIN_PATH_PREFIX = "/admin";

/** Strict page RBAC: first matching prefix wins. Shared routes (feed, explore) are omitted. */
export const ROLE_PATH_RULES: readonly RolePathRule[] = [
  { prefix: "/dashboard/teacher", roles: ["teacher"] },
  { prefix: "/dashboard/parent", roles: ["parent"] },
  { prefix: "/dashboard/student", roles: ["student"] },
  { prefix: "/teacher", roles: ["teacher"] },
  { prefix: "/platform", roles: ["platform"] },
  { prefix: "/parent", roles: ["parent"] },
  { prefix: "/family", roles: ["parent"] },
  { prefix: "/student", roles: ["student"] },
  { prefix: "/learn", roles: ["student", "parent"] },
  { prefix: "/avatar", roles: ["student"] },
  { prefix: "/store", roles: ["student", "parent"] },
  { prefix: "/sparks", roles: ["student"] },
  { prefix: "/create", roles: ["teacher", "platform"] },
] as const;

export function getRequiredRolesForPath(pathname: string): UserRole[] | null {
  for (const rule of ROLE_PATH_RULES) {
    if (pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)) {
      return [...rule.roles];
    }
  }
  return null;
}

export function isRoleAllowedOnPath(pathname: string, role: UserRole): boolean {
  const required = getRequiredRolesForPath(pathname);
  if (!required) return true;
  return required.includes(role);
}

export function getRoleRedirectForPath(pathname: string, role: UserRole): string | null {
  if (isRoleAllowedOnPath(pathname, role)) return null;
  return getRoleDashboardHref(role);
}

export function resolveDashboardAliasRedirect(pathname: string): string | null {
  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    return null;
  }

  const aliasMap: Record<string, string> = {
    "/dashboard/teacher": "/teacher",
    "/dashboard/platform": "/platform",
    "/dashboard/parent": "/parent",
    "/dashboard/student": "/student",
  };

  for (const [alias, target] of Object.entries(aliasMap)) {
    if (pathname === alias) return target;
    if (pathname.startsWith(`${alias}/`)) {
      return `${target}${pathname.slice(alias.length)}`;
    }
  }

  return null;
}

export function resolveRbacRedirect(
  pathname: string,
  role: UserRole | null | undefined,
): string | null {
  if (!role) return AUTH_LOGIN_PATH;
  return getRoleRedirectForPath(pathname, role);
}

export function isAdminPath(pathname: string): boolean {
  return pathname === ADMIN_PATH_PREFIX || pathname.startsWith(`${ADMIN_PATH_PREFIX}/`);
}

export function resolveAdminPageRedirect(
  isPlatformAdmin: boolean,
  role: UserRole | null | undefined,
): string | null {
  if (isPlatformAdmin) return null;
  if (!role) return AUTH_LOGIN_PATH;
  return getRoleDashboardHref(role);
}
