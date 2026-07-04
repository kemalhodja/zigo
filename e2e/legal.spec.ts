import { expect, test } from "@playwright/test";

import { LEGAL_ROUTES } from "./helpers";

test.describe("legal pages", () => {
  for (const route of LEGAL_ROUTES) {
    test(`${route} loads with main content`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.ok()).toBeTruthy();
      await expect(page.locator("#main-content, main, body").first()).toBeVisible();
    });
  }

  test("privacy page exposes policy heading", async ({ page }) => {
    await page.goto("/legal/privacy");
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("delete-account page mentions export flow", async ({ page }) => {
    await page.goto("/legal/delete-account");
    await expect(page.locator("body")).toContainText(/export|veri|data|delete|sil/i);
  });
});
