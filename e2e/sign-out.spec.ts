import { expect, test } from "@playwright/test";

import { demoLogin, dismissAppIntro, isDemoAuthAvailable } from "./helpers";

test.describe("sign out", () => {
  test.beforeEach(async ({ page, request }, testInfo) => {
    await dismissAppIntro(page);
    if (!(await isDemoAuthAvailable(request))) {
      testInfo.skip(true, "Live Supabase demo auth unavailable");
    }
  });

  test("demo student can sign out from header", async ({ page }) => {
    await demoLogin(page, "student");
    await page.getByTestId("sign-out-button").first().click();
    await page.waitForURL(/\/auth/, { timeout: 30_000 });
    await expect(page.getByTestId("auth-mode-sign-in")).toBeVisible();
  });
});
