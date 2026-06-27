import { getRoleDashboardHref } from "@/lib/domain/role-navigation";
import type { UserRole } from "@/lib/supabase/database.types";

/** Zigo login entry (Supabase session/JWT in cookies — not NextAuth). */
export const AUTH_LOGIN_PATH = "/auth";

/**
 * Institution accounts register as `role = teacher` with `organization_type` set.
 * Teacher-only routes therefore cover both individual teachers and institutions.
 */
export type RolePathRule = {
  prefix: string;
  roles: UserRole[];
};

/** Strict RBAC: first matching prefix wins. Shared routes (feed, explore) are omitted. */
export const ADMIN_PATH_PREFIX = "/admin";

export const ROLE_PATH_RULES: RolePathRule[] = [
  { prefix: "/dashboard/teacher", roles: ["teacher"] },
  { prefix: "/dashboard/parent", roles: ["parent"] },
  { prefix: "/dashboard/student", roles: ["student"] },
  { prefix: "/teacher", roles: ["teacher"] },
  { prefix: "/parent", roles: ["parent"] },
  { prefix: "/family", roles: ["parent"] },
  { prefix: "/student", roles: ["student"] },
  { prefix: "/learn", roles: ["student", "parent"] },
  { prefix: "/avatar", roles: ["student"] },
  { prefix: "/store", roles: ["student", "parent"] },
  { prefix: "/sparks", roles: ["student"] },
  { prefix: "/create", roles: ["teacher"] },
];

export function getRequiredRolesForPath(pathname: string): UserRole[] | null {
  for (const rule of ROLE_PATH_RULES) {
    if (pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)) {
      return rule.roles;
    }
  }
  return null;
}

export function isRoleAllowedOnPath(pathname: string, role: UserRole): boolean {
  const required = getRequiredRolesForPath(pathname);
  if (!required) return true;
  return required.includes(role);
}

/** Redirect unauthorized users to their role home; null = allow. */
export function getRoleRedirectForPath(pathname: string, role: UserRole): string | null {
  if (isRoleAllowedOnPath(pathname, role)) return null;
  return getRoleDashboardHref(role);
}

/** Map legacy `/dashboard/*` marketing paths to canonical Zigo routes. */
export function resolveDashboardAliasRedirect(pathname: string): string | null {
  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    return null;
  }

  const aliasMap: Record<string, string> = {
    "/dashboard/teacher": "/teacher",
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

/** Redirect non-platform-admins away from `/admin`; null = allow. */
export function resolveAdminPageRedirect(
  isPlatformAdmin: boolean,
  role: UserRole | null | undefined,
): string | null {
  if (isPlatformAdmin) return null;
  if (!role) return AUTH_LOGIN_PATH;
  return getRoleDashboardHref(role);
}
