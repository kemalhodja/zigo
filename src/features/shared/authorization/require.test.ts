import { beforeEach,describe, expect, it, vi } from "vitest";

vi.mock("@/lib/domain/profiles", () => ({
  getCurrentProfile: vi.fn(),
  getUserInterestAreaIds: vi.fn(),
}));

vi.mock("@/lib/domain/admin", () => ({
  isCurrentUserPlatformAdmin: vi.fn(),
}));

import {
  authorizeRequest,
  buildAuthContext,
  isErrorResponse,
  requireAuthenticatedProfile,
  requirePlatformAdminContext,
} from "@/features/shared/authorization/require";
import { isCurrentUserPlatformAdmin } from "@/lib/domain/admin";
import { getCurrentProfile, getUserInterestAreaIds } from "@/lib/domain/profiles";

const studentProfile = {
  id: "student-1",
  email: "student@example.com",
  full_name: "Student",
  role: "student" as const,
  is_verified: false,
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

const teacherProfile = { ...studentProfile, id: "teacher-1", role: "teacher" as const, is_verified: true };

describe("authorization/require", () => {
  const supabase = {} as never;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when profile is missing", async () => {
    vi.mocked(getCurrentProfile).mockResolvedValue(null);
    const result = await requireAuthenticatedProfile(supabase);
    expect(isErrorResponse(result)).toBe(true);
    if (isErrorResponse(result)) {
      expect(result.status).toBe(401);
    }
  });

  it("returns 403 when role is excluded", async () => {
    vi.mocked(getCurrentProfile).mockResolvedValue(teacherProfile);
    const result = await requireAuthenticatedProfile(supabase, { excludeRoles: ["teacher"] });
    expect(isErrorResponse(result)).toBe(true);
    if (isErrorResponse(result)) {
      expect(result.status).toBe(403);
    }
  });

  it("returns 403 when verified teacher is required", async () => {
    vi.mocked(getCurrentProfile).mockResolvedValue({ ...teacherProfile, is_verified: false });
    const result = await requireAuthenticatedProfile(supabase, { requireVerified: true });
    expect(isErrorResponse(result)).toBe(true);
  });

  it("builds auth context with area ids and admin flag", async () => {
    vi.mocked(getUserInterestAreaIds).mockResolvedValue([1, 3]);
    vi.mocked(isCurrentUserPlatformAdmin).mockResolvedValue(false);

    const context = await buildAuthContext(supabase, studentProfile);
    expect(context.areaIds).toEqual([1, 3]);
    expect(context.isVerifiedTeacher).toBe(false);
    expect(context.isPlatformAdmin).toBe(false);
  });

  it("authorizeRequest enforces API prefix rules from request URL", async () => {
    vi.mocked(getCurrentProfile).mockResolvedValue(teacherProfile);
    vi.mocked(getUserInterestAreaIds).mockResolvedValue([]);
    vi.mocked(isCurrentUserPlatformAdmin).mockResolvedValue(false);

    const blocked = await authorizeRequest(
      supabase,
      new Request("https://zigo.test/api/learn/video"),
      { skipAreaIds: true },
    );
    expect(isErrorResponse(blocked)).toBe(true);

    vi.mocked(getCurrentProfile).mockResolvedValue(studentProfile);

    const allowed = await authorizeRequest(
      supabase,
      new Request("https://zigo.test/api/learn/video"),
      { skipAreaIds: true },
    );
    expect(isErrorResponse(allowed)).toBe(false);
    if (!isErrorResponse(allowed)) {
      expect(allowed.role).toBe("student");
    }
  });

  it("authorizeRequest checks capability when provided", async () => {
    vi.mocked(getCurrentProfile).mockResolvedValue(studentProfile);
    vi.mocked(getUserInterestAreaIds).mockResolvedValue([]);
    vi.mocked(isCurrentUserPlatformAdmin).mockResolvedValue(false);

    const blocked = await authorizeRequest(
      supabase,
      new Request("https://zigo.test/api/social/posts"),
      { capability: "post:create", enforceApiPrefixRule: false, skipAreaIds: true },
    );
    expect(isErrorResponse(blocked)).toBe(true);
  });

  it("requirePlatformAdminContext rejects non-admin users", async () => {
    vi.mocked(getCurrentProfile).mockResolvedValue(teacherProfile);
    vi.mocked(isCurrentUserPlatformAdmin).mockResolvedValue(false);

    const result = await requirePlatformAdminContext(supabase);
    expect(isErrorResponse(result)).toBe(true);
  });

  it("requirePlatformAdminContext accepts platform admins", async () => {
    vi.mocked(getCurrentProfile).mockResolvedValue(teacherProfile);
    vi.mocked(isCurrentUserPlatformAdmin).mockResolvedValue(true);

    const result = await requirePlatformAdminContext(supabase);
    expect(isErrorResponse(result)).toBe(false);
    if (!isErrorResponse(result)) {
      expect(result.isPlatformAdmin).toBe(true);
    }
  });
});
