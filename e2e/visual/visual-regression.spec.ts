import { expect, test } from "@playwright/test";

import { demoLogin, isDemoAuthAvailable } from "../helpers";

test.describe("Visual Regression Tests", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ request }, testInfo) => {
    if (!(await isDemoAuthAvailable(request))) {
      testInfo.skip(true, "Live Supabase demo auth unavailable");
    }
  });

  test.describe("Home Page Visual", () => {
    test("home page hero post", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000); // Wait for animations
      
      await expect(page.locator('[data-testid="hero-post"]').first()).toHaveScreenshot("hero-post.png", {
        threshold: 0.1,
        maxDiffPixels: 100,
      });
    });

    test("home page full feed", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);
      
      await expect(page.locator("#main-content")).toHaveScreenshot("home-feed.png", {
        threshold: 0.1,
        maxDiffPixels: 200,
      });
    });

    test("mobile home feed", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await demoLogin(page, "student");
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);
      
      await expect(page.locator("#main-content")).toHaveScreenshot("mobile-home-feed.png", {
        threshold: 0.1,
        maxDiffPixels: 150,
      });
    });
  });

  test.describe("Pricing Page Visual", () => {
    test("pricing page desktop", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/pricing");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);
      
      await expect(page.locator("#zigo-plus-plans")).toHaveScreenshot("pricing-desktop.png", {
        threshold: 0.1,
        maxDiffPixels: 200,
      });
    });

    test("pricing page mobile", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await demoLogin(page, "student");
      await page.goto("/pricing");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);
      
      await expect(page.locator("#zigo-plus-plans")).toHaveScreenshot("pricing-mobile.png", {
        threshold: 0.1,
        maxDiffPixels: 150,
      });
    });

    test("pricing page feature matrix", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/pricing");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);
      
      await expect(page.locator('text="Özellik Karşılaştırma"')).toBeVisible();
      await expect(page.locator("table")).toHaveScreenshot("pricing-matrix.png", {
        threshold: 0.1,
        maxDiffPixels: 100,
      });
    });
  });

  test.describe("Profile Upgrade Page", () => {
    test("role upgrade page desktop", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/profile/upgrade");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);
      
      await expect(page.locator('[data-testid="role-upgrade-page"]')).toHaveScreenshot("role-upgrade-desktop.png", {
        threshold: 0.1,
        maxDiffPixels: 200,
      });
    });

    test("role cards show base and premium benefits", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/profile/upgrade");
      await page.waitForLoadState("networkidle");
      
      // Click on a role to expand
      await page.getByTestId("role-student").click();
      await page.waitForTimeout(500);
      
      await expect(page.locator('text="Rolle Gelen Temel Özellikler"')).toBeVisible();
      await expect(page.locator('text="Zigo Plus Aboneliğiyle Kazanacağın Premium Ayrıcalıklar"')).toBeVisible();
      await expect(page.locator('[data-testid="premium-benefits"]')).toHaveScreenshot("premium-benefits.png", {
        threshold: 0.1,
        maxDiffPixels: 100,
      });
    });
  });

  test.describe("Game Paywall", () => {
    test("game paywall desktop", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/games/memory");
      await page.waitForLoadState("networkidle");
      
      const paywall = page.locator('[data-testid="game-paywall"]');
      if (await paywall.count() > 0) {
        await expect(paywall).toHaveScreenshot("game-paywall-desktop.png", {
          threshold: 0.1,
          maxDiffPixels: 100,
        });
      }
    });

    test("game paywall mobile", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await demoLogin(page, "student");
      await page.goto("/games/memory");
      await page.waitForLoadState("networkidle");
      
      const paywall = page.locator('[data-testid="game-paywall"]');
      if (await paywall.count() > 0) {
        await expect(paywall).toHaveScreenshot("game-paywall-mobile.png", {
          threshold: 0.1,
          maxDiffPixels: 100,
        });
      }
    });
  });

  test.describe("Trial Banner", () => {
    test("trial banner shows days remaining", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      
      const banner = page.locator('[data-testid="trial-banner"]');
      if (await banner.count() > 0) {
        await expect(banner).toHaveScreenshot("trial-banner.png", {
          threshold: 0.1,
          maxDiffPixels: 50,
        });
      }
    });

    test("trial badge shows days", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      
      const badge = page.locator('[data-testid="trial-badge"]');
      if (await badge.count() > 0) {
        await expect(badge).toHaveScreenshot("trial-badge.png", {
          threshold: 0.1,
          maxDiffPixels: 30,
        });
      }
    });
  });

  test.describe("Game Pages", () => {
    test("games hub desktop", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/games");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);
      
      await expect(page.locator('[data-testid="games-grid"]')).toHaveScreenshot("games-hub-desktop.png", {
        threshold: 0.1,
        maxDiffPixels: 200,
      });
    });

    test("focus page desktop", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/focus");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);
      
      await expect(page.locator('[data-testid="focus-page"]')).toHaveScreenshot("focus-page-desktop.png", {
        threshold: 0.1,
        maxDiffPixels: 200,
      });
    });
  });

  test.describe("Modal Visuals", () => {
    test("google play subscription modal", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/pricing");
      await page.waitForLoadState("networkidle");
      
      // Click subscribe to open modal
      await page.getByTestId("plan-zigo-plus-student-monthly").getByRole("button", { name: /abone ol/i }).click();
      await page.waitForTimeout(500);
      
      await expect(page.locator('[data-testid="google-play-modal"]')).toHaveScreenshot("google-play-modal.png", {
        threshold: 0.1,
        maxDiffPixels: 100,
      });
    });

    test("paywall modal", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/games/memory");
      await page.waitForLoadState("networkidle");
      
      const paywall = page.locator('[data-testid="game-paywall"]');
      if (await paywall.count() > 0) {
        await expect(paywall).toHaveScreenshot("paywall-modal.png", {
          threshold: 0.1,
          maxDiffPixels: 100,
        });
      }
    });
  });
});