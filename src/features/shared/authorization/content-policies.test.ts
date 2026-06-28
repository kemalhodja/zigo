import { describe, expect, it } from "vitest";

import {
  canAnswerQuestion,
  canAskQuestion,
  canCreatePost,
  canStudentSendDirectMessage,
} from "@/features/shared/authorization/content-policies";
import { profileToAuthContext } from "@/features/shared/authorization/require";
import type { UserProfile } from "@/lib/domain/profiles";

function auth(role: UserProfile["role"], verified = false, areaIds = [10, 20]) {
  return profileToAuthContext(
    {
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
    },
    { areaIds },
  );
}

describe("authorization/content-policies", () => {
  it("enforces match-feed area scope for questions", () => {
    expect(canAskQuestion(auth("student"), 10).allowed).toBe(true);
    expect(canAskQuestion(auth("student"), 99).allowed).toBe(false);
  });

  it("blocks teachers from asking questions", () => {
    expect(canAskQuestion(auth("teacher", true), 10).allowed).toBe(false);
  });

  it("requires verified teacher and assigned area to publish posts", () => {
    expect(canCreatePost(auth("teacher", true), 10).allowed).toBe(true);
    expect(canCreatePost(auth("teacher", false), 10).allowed).toBe(false);
    expect(canCreatePost(auth("teacher", true), 99).allowed).toBe(false);
    expect(canCreatePost(auth("student"), 10).allowed).toBe(false);
  });

  it("requires verified teacher and question area overlap to answer", () => {
    expect(canAnswerQuestion(auth("teacher", true), 10).allowed).toBe(true);
    expect(canAnswerQuestion(auth("teacher", true), 99).allowed).toBe(false);
    expect(canAnswerQuestion(auth("teacher", false), 10).allowed).toBe(false);
    expect(canAnswerQuestion(auth("parent"), 10).allowed).toBe(false);
  });

  it("never allows student direct messaging", () => {
    expect(canStudentSendDirectMessage().allowed).toBe(false);
  });
});
