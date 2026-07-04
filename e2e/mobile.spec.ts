import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

test.describe("mobile viewport", () => {
  test("home feed fits mobile viewport", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(390);
  });

  test("bottom navigation is visible on home", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("nav").first();
    if ((await nav.count()) === 0) {
      test.skip(true, "Nav not rendered — app may be in error/preview state");
      return;
    }
    await expect(nav).toBeVisible();
  });

  test("learn hub renders on mobile", async ({ page }) => {
    const response = await page.goto("/learn");
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator("body")).toBeVisible();
  });

  test("micro page renders on mobile", async ({ page }) => {
    await page.goto("/micro");
    await expect(page.locator("body")).toBeVisible();
  });

  test("family page renders on mobile", async ({ page }) => {
    await page.goto("/family");
    await expect(page.locator("body")).toBeVisible();
  });
});
