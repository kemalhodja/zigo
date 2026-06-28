import { describe, expect, it } from "vitest";

import {
  evaluateCapability,
  roleHasCapability,
  ZIGO_CAPABILITY_RULES,
} from "@/features/shared/authorization/capabilities";
import { profileToAuthContext } from "@/features/shared/authorization/require";
import type { ZigoCapability } from "@/features/shared/authorization/types";
import type { UserProfile } from "@/lib/domain/profiles";

function profile(role: UserProfile["role"], verified = false): UserProfile {
  return {
    id: "user-1",
    email: "user@example.com",
    full_name: "Test User",
    role,
    is_verified: verified,
    avatar_assets: { hat: null, suit: null, pet: null },
    total_points: 0,
    reputation_score: 0,
    bio: null,
    avatar_url: null,
    level: 1,
    student_document_url: null,
    student_document_status: null,
    student_document_submitted_at: null,
    student_document_reviewed_at: null,
    student_document_reviewed_by: null,
    grade_level: null,
    shortcut_preferences: {},
    city: null,
    organization_type: null,
    social_safety_strike_count: 0,
    social_interactions_blocked: false,
    social_interactions_blocked_at: null,
    created_at: new Date().toISOString(),
  };
}

function ctx(role: UserProfile["role"], verified = false, isPlatformAdmin = false) {
  return profileToAuthContext(profile(role, verified), { isPlatformAdmin, areaIds: [1, 2] });
}

describe("authorization/capabilities", () => {
  it("defines a capability rule for every Zigo capability", () => {
    const keys = Object.keys(ZIGO_CAPABILITY_RULES) as ZigoCapability[];
    expect(keys.length).toBeGreaterThan(10);
    for (const key of keys) {
      expect(ZIGO_CAPABILITY_RULES[key]?.roles.length).toBeGreaterThan(0);
    }
  });

  it("allows verified teachers to create posts but not unverified teachers", () => {
    expect(evaluateCapability(ctx("teacher", true), "post:create").allowed).toBe(true);
    expect(evaluateCapability(ctx("teacher", false), "post:create").allowed).toBe(false);
  });

  it("allows students and parents to ask questions but not teachers", () => {
    expect(roleHasCapability("student", "question:create")).toBe(true);
    expect(roleHasCapability("parent", "question:create")).toBe(true);
    expect(roleHasCapability("teacher", "question:create")).toBe(false);
  });

  it("blocks teachers from learn access", () => {
    expect(roleHasCapability("teacher", "learn:access")).toBe(false);
    expect(roleHasCapability("student", "learn:access")).toBe(true);
  });

  it("blocks students from lesson requests and weekly parent progress", () => {
    expect(roleHasCapability("student", "lesson_request:create")).toBe(false);
    expect(roleHasCapability("parent", "lesson_request:create")).toBe(true);
    expect(roleHasCapability("student", "parent:weekly_progress")).toBe(false);
    expect(roleHasCapability("parent", "parent:weekly_progress")).toBe(true);
  });

  it("requires platform admin flag for admin capability", () => {
    expect(evaluateCapability(ctx("teacher", true), "admin:platform").allowed).toBe(false);
    expect(evaluateCapability(ctx("teacher", true, true), "admin:platform").allowed).toBe(true);
  });
});

describe("authorization capability matrix", () => {
  const matrix: Array<[ZigoCapability, UserProfile["role"], boolean, boolean]> = [
    ["post:create", "teacher", true, true],
    ["post:create", "teacher", false, false],
    ["post:create", "student", false, false],
    ["answer:create", "teacher", true, true],
    ["answer:create", "parent", false, false],
    ["question:create", "student", false, true],
    ["question:create", "teacher", false, false],
    ["avatar:customize", "student", false, true],
    ["avatar:customize", "parent", false, false],
    ["child:manage", "parent", false, true],
    ["child:manage", "student", false, false],
  ];

  it.each(matrix)("capability %s for %s (verified=%s) => %s", (capability, role, verified, expected) => {
    expect(roleHasCapability(role, capability, { isVerifiedTeacher: verified })).toBe(expected);
  });
});
