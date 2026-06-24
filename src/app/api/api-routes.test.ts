import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET as accountExportGet } from "@/app/api/account/export/route";
import { POST as answersPost } from "@/app/api/answers/route";
import { POST as authSignInPost } from "@/app/api/auth/sign-in/route";
import { POST as gamificationAwardPost } from "@/app/api/gamification/award/route";
import { POST as learnQuizPost } from "@/app/api/learn/quiz/route";
import { GET as legacyPostsGet, POST as legacyPostsPost } from "@/app/api/posts/route";
import { GET as healthGet, MIGRATION_TARGET } from "@/app/api/setup/health/route";
import { GET as socialPostsGet, POST as socialPostsPost } from "@/app/api/social/posts/route";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

vi.mock("@/lib/domain/profiles", () => ({
  getCurrentProfile: vi.fn(),
  getUserInterestAreaIds: vi.fn(),
}));

vi.mock("@/lib/domain/social", () => ({
  createSocialPost: vi.fn(),
  createSocialPostSchema: {
    parse: vi.fn((value: unknown) => value),
  },
  getSocialFeed: vi.fn(async () => ({ posts: [], nextCursor: null })),
  SOCIAL_FEED_CACHE_TAG: "social-feed",
  socialFeedCacheTag: (userId: string) => `social-feed:${userId}`,
}));

vi.mock("@/lib/domain/learning", () => ({
  submitQuizAttempt: vi.fn(),
}));

vi.mock("@/lib/domain/questions", () => ({
  createTeacherAnswer: vi.fn(),
}));

vi.mock("@/lib/domain/subscription", () => ({
  getUserSubscription: vi.fn(),
}));

vi.mock("@/lib/domain/account-compliance", () => ({
  exportUserData: vi.fn(async () => ({ profile: { id: "u1" } })),
}));

vi.mock("@/lib/domain/live-gates", () => ({
  getLiveGates: vi.fn(async () => ({
    readyCount: 3,
    totalCount: 3,
    gates: [],
  })),
}));

import { submitQuizAttempt } from "@/lib/domain/learning";
import { getCurrentProfile, getUserInterestAreaIds } from "@/lib/domain/profiles";
import { createTeacherAnswer } from "@/lib/domain/questions";
import { createSocialPost } from "@/lib/domain/social";
import { getUserSubscription } from "@/lib/domain/subscription";
import { createClient } from "@/lib/supabase/server";

describe("API route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue({} as never);
  });

  it("legacy GET /api/posts returns 410", async () => {
    const response = await legacyPostsGet();
    expect(response.status).toBe(410);
    const body = await response.json();
    expect(body.code).toBe("LEGACY_POSTS_RETIRED");
  });

  it("legacy POST /api/posts returns 410", async () => {
    const response = await legacyPostsPost();
    expect(response.status).toBe(410);
    const body = await response.json();
    expect(body.replacement).toBe("/api/social/posts");
  });

  it("POST /api/gamification/award returns 410", async () => {
    const response = await gamificationAwardPost();
    expect(response.status).toBe(410);
  });

  it("GET /api/setup/health exposes migration target 42", async () => {
    const response = await healthGet();
    expect(response.ok).toBe(true);
    const body = await response.json();
    expect(body.data.migrationTarget).toBe(MIGRATION_TARGET);
  });

  it("POST /api/auth/sign-in validates payload", async () => {
    const response = await authSignInPost(
      new Request("http://localhost/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "bad-email", password: "123" }),
      }),
    );
    expect(response.status).toBe(400);
  });

  it("GET /api/account/export requires auth", async () => {
    vi.mocked(getCurrentProfile).mockResolvedValue(null);
    const response = await accountExportGet();
    expect(response.status).toBe(401);
  });

  it("GET /api/account/export returns export payload", async () => {
    vi.mocked(getCurrentProfile).mockResolvedValue({
      id: "00000000-0000-4000-8000-000000000301",
    } as never);
    const response = await accountExportGet();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.profile.id).toBe("u1");
  });

  it("GET /api/social/posts returns feed meta", async () => {
    vi.mocked(getCurrentProfile).mockResolvedValue(null);
    const response = await socialPostsGet(new Request("http://localhost/api/social/posts"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.meta).toEqual(expect.objectContaining({ limit: 30, offset: 0 }));
  });

  it("POST /api/social/posts rejects unauthenticated users", async () => {
    vi.mocked(getCurrentProfile).mockResolvedValue(null);
    const response = await socialPostsPost(
      new Request("http://localhost/api/social/posts", {
        method: "POST",
        body: JSON.stringify({ caption: "Test", areaId: 1 }),
      }),
    );
    expect(response.status).toBe(401);
  });

  it("POST /api/social/posts rejects non-verified teachers", async () => {
    vi.mocked(getCurrentProfile).mockResolvedValue({
      id: "t1",
      role: "teacher",
      is_verified: false,
    } as never);
    const response = await socialPostsPost(
      new Request("http://localhost/api/social/posts", {
        method: "POST",
        body: JSON.stringify({ caption: "Test", areaId: 1 }),
      }),
    );
    expect(response.status).toBe(403);
  });

  it("POST /api/social/posts rejects unassigned teacher areas", async () => {
    vi.mocked(getCurrentProfile).mockResolvedValue({
      id: "t1",
      role: "teacher",
      is_verified: true,
    } as never);
    vi.mocked(getUserInterestAreaIds).mockResolvedValue([2]);
    const response = await socialPostsPost(
      new Request("http://localhost/api/social/posts", {
        method: "POST",
        body: JSON.stringify({ caption: "Test", areaId: 1 }),
      }),
    );
    expect(response.status).toBe(403);
  });

  it("POST /api/social/posts creates posts for verified teachers", async () => {
    vi.mocked(getCurrentProfile).mockResolvedValue({
      id: "t1",
      role: "teacher",
      is_verified: true,
    } as never);
    vi.mocked(getUserInterestAreaIds).mockResolvedValue([1]);
    vi.mocked(getUserSubscription).mockResolvedValue({ tier: "free", isPremium: false });
    vi.mocked(createSocialPost).mockResolvedValue({ id: "p1" } as never);

    const response = await socialPostsPost(
      new Request("http://localhost/api/social/posts", {
        method: "POST",
        body: JSON.stringify({ caption: "Test", areaId: 1 }),
      }),
    );

    expect(response.status).toBe(201);
    expect(createSocialPost).toHaveBeenCalled();
  });

  it("POST /api/learn/quiz requires auth", async () => {
    vi.mocked(getCurrentProfile).mockResolvedValue(null);
    const response = await learnQuizPost(
      new Request("http://localhost/api/learn/quiz", {
        method: "POST",
        body: JSON.stringify({ quizId: "00000000-0000-4000-8000-000000000701" }),
      }),
    );
    expect(response.status).toBe(401);
  });

  it("POST /api/learn/quiz rejects teachers", async () => {
    vi.mocked(getCurrentProfile).mockResolvedValue({ id: "t1", role: "teacher" } as never);
    const response = await learnQuizPost(
      new Request("http://localhost/api/learn/quiz", {
        method: "POST",
        body: JSON.stringify({ quizId: "00000000-0000-4000-8000-000000000701" }),
      }),
    );
    expect(response.status).toBe(403);
  });

  it("POST /api/learn/quiz requires child profile for parents", async () => {
    vi.mocked(getCurrentProfile).mockResolvedValue({ id: "p1", role: "parent" } as never);
    const response = await learnQuizPost(
      new Request("http://localhost/api/learn/quiz", {
        method: "POST",
        body: JSON.stringify({ quizId: "00000000-0000-4000-8000-000000000701" }),
      }),
    );
    expect(response.status).toBe(400);
  });

  it("POST /api/learn/quiz submits student attempts", async () => {
    vi.mocked(getCurrentProfile).mockResolvedValue({ id: "s1", role: "student" } as never);
    vi.mocked(submitQuizAttempt).mockResolvedValue({ id: "attempt1" } as never);

    const response = await learnQuizPost(
      new Request("http://localhost/api/learn/quiz", {
        method: "POST",
        body: JSON.stringify({
          quizId: "00000000-0000-4000-8000-000000000701",
          selectedOption: 1,
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(submitQuizAttempt).toHaveBeenCalled();
  });

  it("POST /api/answers rejects unauthenticated users", async () => {
    vi.mocked(getCurrentProfile).mockResolvedValue(null);
    const response = await answersPost(
      new Request("http://localhost/api/answers", {
        method: "POST",
        body: JSON.stringify({ questionId: "q1", content: "A long enough answer." }),
      }),
    );
    expect(response.status).toBe(401);
  });

  it("POST /api/answers rejects non-verified teachers", async () => {
    vi.mocked(getCurrentProfile).mockResolvedValue({
      id: "t1",
      role: "teacher",
      is_verified: false,
    } as never);
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({ data: { area_id: 1 }, error: null })),
          })),
        })),
      })),
    } as never);

    const response = await answersPost(
      new Request("http://localhost/api/answers", {
        method: "POST",
        body: JSON.stringify({ questionId: "q1", content: "A long enough answer." }),
      }),
    );
    expect(response.status).toBe(403);
  });

  it("POST /api/answers creates answers for verified teachers", async () => {
    vi.mocked(getCurrentProfile).mockResolvedValue({
      id: "t1",
      role: "teacher",
      is_verified: true,
    } as never);
    vi.mocked(getUserInterestAreaIds).mockResolvedValue([1]);
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({ data: { area_id: 1 }, error: null })),
          })),
        })),
      })),
    } as never);
    vi.mocked(createTeacherAnswer).mockResolvedValue({ id: "a1" } as never);

    const response = await answersPost(
      new Request("http://localhost/api/answers", {
        method: "POST",
        body: JSON.stringify({ questionId: "q1", content: "A long enough answer." }),
      }),
    );

    expect(response.status).toBe(201);
    expect(createTeacherAnswer).toHaveBeenCalled();
  });
});
