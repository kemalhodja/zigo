import { expect, test } from "@playwright/test";

import { dismissAppIntro } from "./helpers";

const DEMO_PASSWORD = "ZigoTest123!";
const MERT_TEACHER_ID = "00000000-0000-4000-8000-000000000102";

test.describe("admin teacher verification", () => {
  test.beforeEach(async ({ page }) => {
    await dismissAppIntro(page);
  });

  test("platform admin can verify teacher via API", async ({ page }) => {
    const signIn = await page.request.post("/api/auth/sign-in", {
      data: { email: "admin@zigo.test", password: DEMO_PASSWORD },
    });
    expect(signIn.ok()).toBeTruthy();

    const verify = await page.request.post("/api/admin/teachers/verify", {
      data: {
        teacherId: MERT_TEACHER_ID,
        verified: true,
      },
    });

    expect(verify.ok()).toBeTruthy();
    const body = (await verify.json()) as { data?: { is_verified?: boolean } };
    expect(body.data?.is_verified).toBe(true);
  });
});
