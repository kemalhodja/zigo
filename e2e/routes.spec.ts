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
  test("/reels redirects to /micro", async ({ request }) => {
    const response = await request.get("/reels", { maxRedirects: 0 });
    expect(response.status()).toBeGreaterThanOrEqual(300);
    expect(response.headers().location).toMatch(/\/micro/);
  });

  test("/stories redirects to /sparks", async ({ request }) => {
    const response = await request.get("/stories", { maxRedirects: 0 });
    expect(response.status()).toBeGreaterThanOrEqual(300);
    expect(response.headers().location).toMatch(/\/sparks/);
  });
});
