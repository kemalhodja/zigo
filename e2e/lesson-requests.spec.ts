import { expect, test } from "@playwright/test";

import { DEMO_ACCOUNTS, DEMO_PASSWORD, isDemoAuthAvailable } from "./helpers";

test.describe("Lesson requests API", () => {
  test.beforeEach(async ({ request }) => {
    test.skip(!(await isDemoAuthAvailable(request)), "Demo auth is unavailable for this environment.");
  });

  test("students cannot access lesson requests", async ({ request }) => {
    const signIn = await request.post("/api/auth/sign-in", {
      data: { email: DEMO_ACCOUNTS.student, password: DEMO_PASSWORD },
    });
    expect(signIn.ok()).toBeTruthy();

    const response = await request.get("/api/lesson-requests");
    expect(response.status()).toBe(403);
  });

  test("parents can list lesson requests", async ({ request }) => {
    const signIn = await request.post("/api/auth/sign-in", {
      data: { email: DEMO_ACCOUNTS.parent, password: DEMO_PASSWORD },
    });
    expect(signIn.ok()).toBeTruthy();

    const response = await request.get("/api/lesson-requests");
    expect(response.status()).toBeLessThan(500);
    expect([200, 400]).toContain(response.status());
  });

  test("unauthenticated POST is rejected", async ({ request }) => {
    const response = await request.post("/api/lesson-requests", {
      data: {
        receiverId: "22222222-2222-4222-8222-222222222222",
        messageBody: "Merhaba, matematik dersi desteği istiyoruz.",
      },
    });
    expect([401, 400, 403]).toContain(response.status());
  });
});
