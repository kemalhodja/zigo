import { expect, test } from "@playwright/test";

import { resetDemoSocialAccountsForE2e } from "./helpers";
import { expectedMigrationTarget } from "./migration-target";

test.describe("API contracts", () => {
  test("health API reports current migration target", async ({ request }) => {
    const response = await request.get("/api/setup/health");
    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as { data?: { migrationTarget?: number } };
    expect(body.data?.migrationTarget).toBe(expectedMigrationTarget());
  });

  test("legacy GET /api/posts returns 410", async ({ request }) => {
    const response = await request.get("/api/posts");
    expect(response.status()).toBe(410);
    const body = (await response.json()) as { code?: string };
    expect(body.code).toBe("LEGACY_POSTS_RETIRED");
  });

  test("legacy POST /api/posts returns 410", async ({ request }) => {
    const response = await request.post("/api/posts", {
      data: { title: "legacy", content: "test" },
    });
    expect(response.status()).toBe(410);
  });

  test("direct gamification award stays disabled", async ({ request }) => {
    const response = await request.post("/api/gamification/award", { data: {} });
    expect(response.status()).toBe(410);
  });

  test("sign-in rejects invalid credentials shape", async ({ request }) => {
    const response = await request.post("/api/auth/sign-in", {
      data: { email: "not-an-email", password: "123" },
    });
    expect([400, 429]).toContain(response.status());
  });

  test("account export requires authentication", async ({ request }) => {
    const response = await request.get("/api/account/export");
    expect(response.status()).toBe(401);
  });

  test("social posts GET is publicly reachable", async ({ request }) => {
    const response = await request.get("/api/social/posts");
    expect(response.status()).toBeLessThan(500);
  });

  test("social posts POST requires authentication", async ({ request }) => {
    const response = await request.post("/api/social/posts", {
      data: { caption: "Test", areaId: 1 },
    });
    expect(response.status()).toBe(401);
  });

  test("social comments POST requires authentication", async ({ request }) => {
    const response = await request.post("/api/social/comments", {
      data: {
        postId: "00000000-0000-4000-8000-000000000601",
        content: "hello",
      },
    });
    expect(response.status()).toBe(401);
  });

  test("learn quiz POST requires authentication", async ({ request }) => {
    const response = await request.post("/api/learn/quiz", {
      data: { quizId: "00000000-0000-4000-8000-000000000701" },
    });
    expect(response.status()).toBe(401);
  });

  test("moderation blocked text returns 422 when authed", async ({ request }) => {
    await resetDemoSocialAccountsForE2e();

    const signIn = await request.post("/api/auth/sign-in", {
      data: { email: "student@zigo.test", password: "ZigoTest123!" },
    });

    if (!signIn.ok()) {
      test.skip(true, "Live Supabase auth unavailable — set local demo for moderation E2E");
      return;
    }

    const response = await request.post("/api/social/comments", {
      data: {
        postId: "00000000-0000-4000-8000-000000000601",
        content: "bu metin aptal",
      },
    });

    expect([400, 422]).toContain(response.status());
    const body = (await response.json()) as { code?: string; error?: string };
    expect(body.code === "MODERATION_BLOCKED" || /moderasyon|blocked/i.test(body.error ?? "")).toBeTruthy();
  });
});
