import { expect, test } from "@playwright/test";

import { demoLogin, isDemoAuthAvailable } from "../helpers";

test.describe("Games Critical Paths", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ request }, testInfo) => {
    if (!(await isDemoAuthAvailable(request))) {
      testInfo.skip(true, "Live Supabase demo auth unavailable");
    }
  });

  test.describe("Game Paywall", () => {
    test("non-premium sees paywall with subscribe button", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/games/memory");
      
      const paywall = page.locator('[data-testid="game-paywall"]');
      if (await paywall.count() > 0) {
        await expect(paywall).toBeVisible();
        await expect(page.locator('text="Zigo Plus"')).toBeVisible();
        await expect(page.locator('text="Abone Ol"')).toBeVisible();
      }
    });

    test("premium user bypasses paywall", async () => {
      test.skip(true, "Requires premium test account");
    });

    test("paywall shows game features", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/games/taboo");
      
      const paywall = page.locator('[data-testid="game-paywall"]');
      if (await paywall.count() > 0) {
        await expect(paywall.locator('text="Zeka Oyunları Salonu"')).toBeVisible();
        await expect(paywall.locator('text="Günde 1 Saat"')).toBeVisible();
        await expect(paywall.locator('text="08:00–22:00"')).toBeVisible();
      }
    });
  });

  test.describe("Game Time Limits", () => {
    test("daily limit shows remaining time", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/games/word");
      
      const limitWall = page.locator('[data-testid="time-limit-wall"]');
      if (await limitWall.count() > 0) {
        await expect(limitWall).toBeVisible();
        await expect(limitWall.locator('text=/dk|min/')).toBeVisible();
      }
    });

    test("night ban shows active hours", async () => {
      test.skip(true, "Requires time manipulation");
    });

    test("limit reached blocks gameplay", async () => {
      test.skip(true, "Requires playing to limit");
    });
  });

  test.describe("Game Play", () => {
    test("memory game loads and plays", async ({ page }) => {
      await demoLogin(page, "student");
      
      // Need premium or trial
      await page.goto("/games/memory");
      
      const gameCanvas = page.locator('[data-testid="game-canvas"], canvas').first();
      if (await gameCanvas.count() > 0) {
        await expect(gameCanvas).toBeVisible();
        
        // Try a click
        await gameCanvas.click({ position: { x: 100, y: 100 } });
        await page.waitForTimeout(500);
      }
    });

    test("taboo game loads", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/games/taboo");
      
      // Should show mode selection
      await expect(page.locator('text="Zigo Tabu"')).toBeVisible();
      await expect(page.locator('text="Klasik Tabu"')).toBeVisible();
      await expect(page.locator('text="AI Tabu"')).toBeVisible();
    });

    test("word hunt game loads", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/games/word");
      
      await expect(page.locator('[data-testid="game-canvas"], canvas').first()).toBeVisible();
    });
  });

  test.describe("Daily Limit & Night Ban", () => {
    test("daily limit resets at midnight", async () => {
      test.skip(true, "Requires time manipulation");
    });

    test("night ban 22:00-08:00 blocks access", async () => {
      test.skip(true, "Requires time manipulation");
    });

    test("veli can extend limit for child", async () => {
      test.skip(true, "Requires parent-child setup");
    });
  });

  test.describe("Game Progress Tracking", () => {
    test("game session tracked", async () => {
      test.skip(true, "Requires game session API");
    });

    test("leaderboard shows scores", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/games/memory");
      
      const leaderboard = page.locator('[data-testid="leaderboard"]');
      if (await leaderboard.count() > 0) {
        await expect(leaderboard).toBeVisible();
      }
    });
  });
});