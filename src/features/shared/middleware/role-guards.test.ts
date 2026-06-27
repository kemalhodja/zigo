import { describe, expect, it } from "vitest";

import {
  AUTH_LOGIN_PATH,
  getRequiredRolesForPath,
  getRoleRedirectForPath,
  isAdminPath,
  isRoleAllowedOnPath,
  resolveAdminPageRedirect,
  resolveDashboardAliasRedirect,
  resolveRbacRedirect,
} from "@/features/shared/middleware/role-guards";

describe("role-guards RBAC", () => {
  it("blocks students from teacher studio and dashboard/teacher URLs", () => {
    expect(isRoleAllowedOnPath("/teacher", "student")).toBe(false);
    expect(isRoleAllowedOnPath("/dashboard/teacher", "student")).toBe(false);
    expect(getRoleRedirectForPath("/teacher", "student")).toBe("/student");
    expect(getRoleRedirectForPath("/dashboard/teacher", "student")).toBe("/student");
  });

  it("allows teachers on teacher routes (includes institution accounts)", () => {
    expect(getRequiredRolesForPath("/teacher")).toEqual(["teacher"]);
    expect(getRequiredRolesForPath("/dashboard/teacher")).toEqual(["teacher"]);
    expect(isRoleAllowedOnPath("/dashboard/teacher", "teacher")).toBe(true);
  });

  it("blocks parents from student-only gamification routes", () => {
    expect(isRoleAllowedOnPath("/student", "parent")).toBe(false);
    expect(isRoleAllowedOnPath("/dashboard/student", "parent")).toBe(false);
    expect(getRoleRedirectForPath("/dashboard/student", "parent")).toBe("/parent");
  });

  it("allows parents on learn but not teachers", () => {
    expect(isRoleAllowedOnPath("/learn", "parent")).toBe(true);
    expect(isRoleAllowedOnPath("/learn", "teacher")).toBe(false);
  });

  it("maps dashboard aliases to canonical routes", () => {
    expect(resolveDashboardAliasRedirect("/dashboard/teacher")).toBe("/teacher");
    expect(resolveDashboardAliasRedirect("/dashboard/parent/reports")).toBe("/parent/reports");
    expect(resolveDashboardAliasRedirect("/feed")).toBeNull();
  });

  it("sends missing role to auth login", () => {
    expect(resolveRbacRedirect("/teacher", null)).toBe(AUTH_LOGIN_PATH);
    expect(resolveRbacRedirect("/teacher", undefined)).toBe(AUTH_LOGIN_PATH);
  });

  it("blocks non-platform-admins from /admin", () => {
    expect(isAdminPath("/admin")).toBe(true);
    expect(isAdminPath("/admin/teachers")).toBe(true);
    expect(isAdminPath("/teacher")).toBe(false);
    expect(resolveAdminPageRedirect(false, "student")).toBe("/student");
    expect(resolveAdminPageRedirect(false, "parent")).toBe("/parent");
    expect(resolveAdminPageRedirect(false, null)).toBe(AUTH_LOGIN_PATH);
    expect(resolveAdminPageRedirect(true, "student")).toBeNull();
  });
});
