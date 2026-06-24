import { expect, test } from "@playwright/test";

import { PUBLIC_APP_ROUTES } from "./helpers";

test.describe("public app routes", () => {
  for (const route of PUBLIC_APP_ROUTES) {
    test(`${route} responds without server error`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status()).toBeLessThan(500);
      await expect(page.locator("body")).toBeVisible();
    });
  }
});

test.describe("legacy redirects", () => {
  test("/reels redirects to /micro", async ({ page }) => {
    await page.goto("/reels");
    await expect(page).toHaveURL(/\/micro/);
  });

  test("/stories redirects to /sparks", async ({ page }) => {
    await page.goto("/stories");
    await expect(page).toHaveURL(/\/sparks/);
  });
});
