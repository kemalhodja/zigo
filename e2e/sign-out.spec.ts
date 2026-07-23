import { expect, test } from "@playwright/test";

import { demoLogin,dismissAppIntro } from "./helpers";

test.describe("sign out", () => {
  test.beforeEach(async ({ page }) => {
    await dismissAppIntro(page);
  });

  test("demo student can sign out from header", async ({ page }) => {
    await demoLogin(page, "student");
    await page.getByTestId("sign-out-button").first().click();
    await page.waitForURL(/\/auth/, { timeout: 30_000 });
    await expect(page.getByTestId("auth-mode-sign-in")).toBeVisible();
  });
});
