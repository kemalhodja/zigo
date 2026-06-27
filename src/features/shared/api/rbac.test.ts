import { describe, expect, it } from "vitest";

import {
  API_RBAC_PREFIX_RULES,
  getApiRbacRule,
  isApiRoleAllowed,
} from "@/features/shared/api/rbac";

describe("API RBAC rules", () => {
  it("requires platform admin for /api/admin routes", () => {
    expect(getApiRbacRule("/api/admin/teachers/verify")?.requirePlatformAdmin).toBe(true);
    expect(isApiRoleAllowed("/api/admin/teachers/verify", "teacher", false)).toBe(false);
    expect(isApiRoleAllowed("/api/admin/teachers/verify", "teacher", true)).toBe(true);
  });

  it("blocks teachers from learn API prefix", () => {
    expect(isApiRoleAllowed("/api/learn/video", "teacher", false)).toBe(false);
    expect(isApiRoleAllowed("/api/learn/video", "student", false)).toBe(true);
  });

  it("blocks students from lesson-requests API prefix", () => {
    expect(isApiRoleAllowed("/api/lesson-requests", "student", false)).toBe(false);
    expect(isApiRoleAllowed("/api/lesson-requests", "parent", false)).toBe(true);
  });

  it("documents at least admin and ecosystem prefixes", () => {
    const prefixes = API_RBAC_PREFIX_RULES.map((rule) => rule.prefix);
    expect(prefixes).toContain("/api/admin");
    expect(prefixes).toContain("/api/ecosystem/bookings");
  });
});
