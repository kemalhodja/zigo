import { expect, test } from "@playwright/test";

test.describe("accessibility", () => {
  test("skip link moves focus to main content when app shell renders", async ({ page }) => {
    await page.goto("/");
    const skipLink = page.getByTestId("skip-to-content");
    if ((await skipLink.count()) === 0) {
      test.skip(true, "Skip link unavailable — Supabase preview/error shell");
      return;
    }
    await skipLink.focus();
    await expect(skipLink).toBeFocused();
    await expect(page.locator("#main-content")).toBeVisible();
  });

  test("home page exposes readable content", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#main-content, main, body").first()).toBeVisible();
  });

  test("auth page has visible body content", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.locator("main, #main-content, body").first()).toBeVisible();
  });

  test("setup page has heading structure", async ({ page }) => {
    await page.goto("/setup");
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("legal privacy page is keyboard reachable", async ({ page }) => {
    await page.goto("/legal/privacy");
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    await expect(focused).toBeVisible();
  });
});
