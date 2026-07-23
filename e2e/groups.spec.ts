import { expect, test } from "@playwright/test";

import { demoLogin, dismissAppIntro, isDemoAuthAvailable } from "./helpers";

test.describe("study groups", () => {
  test.beforeEach(async ({ page, request }, testInfo) => {
    await dismissAppIntro(page);
    if (!(await isDemoAuthAvailable(request))) {
      testInfo.skip(true, "Live Supabase demo auth unavailable");
    }
  });

  test("student can open groups hub", async ({ page }) => {
    await demoLogin(page, "student");
    await page.goto("/groups");
    await expect(page.getByText(/Grup kur|Create groups|Çalışma grupları/i)).toBeVisible();
  });

  test("parent can open groups hub", async ({ page }) => {
    await demoLogin(page, "parent");
    await page.goto("/groups");
    await expect(page.getByText(/Grup kur|Create groups|Çalışma grupları/i)).toBeVisible();
  });
});
