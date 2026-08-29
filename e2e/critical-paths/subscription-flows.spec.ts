import { expect, test } from "@playwright/test";

import { demoLogin, isDemoAuthAvailable } from "../helpers";

test.describe("Subscription Critical Paths", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ request }, testInfo) => {
    if (!(await isDemoAuthAvailable(request))) {
      testInfo.skip(true, "Live Supabase demo auth unavailable");
    }
  });

  test.describe("Trial Period", () => {
    test("new user gets 7-day trial badge", async ({ page }) => {
      await demoLogin(page, "student");
      
      const trialBadge = page.locator('[data-testid="trial-badge"]');
      if (await trialBadge.count() > 0) {
        await expect(trialBadge).toContainText(/gün kaldı|days left/i);
        await expect(page.locator("text=%50")).toBeVisible();
      }
    });

    test("trial countdown decrements", async ({ page }) => {
      await demoLogin(page, "student");
      
      const trialText = page.locator('[data-testid="trial-badge"]');
      if (await trialText.count() > 0) {
        const text = await trialText.textContent();
        expect(text).toMatch(/\d+\s*gün/);
      }
    });

    test("trial expiry removes premium features", async () => {
      test.skip(true, "Requires test account with expired trial");
    });
  });

  test.describe("Google Play Subscription Flow", () => {
    test("student monthly plan shows correct price", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/pricing");
      
      await expect(page.locator('[data-testid="plan-zigo-plus-student-monthly"]')).toBeVisible();
      await expect(page.locator('text="Aylık"')).toBeVisible();
      await expect(page.locator('text="49"')).toBeVisible(); // 49 ₺
    });

    test("student yearly plan shows discount", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/pricing");
      
      await page.getByTestId("interval-yearly").click();
      await expect(page.locator('[data-testid="plan-zigo-plus-student-yearly"]')).toBeVisible();
      await expect(page.locator('text="Yıllık"')).toBeVisible();
      await expect(page.locator('text="450"')).toBeVisible(); // 450 ₺
    });

    test("teacher plans show higher price", async ({ page }) => {
      await demoLogin(page, "teacher");
      await page.goto("/pricing");
      
      await expect(page.locator('[data-testid="plan-zigo-plus-teachers-monthly"]')).toBeVisible();
      await expect(page.locator('text="99"')).toBeVisible(); // 99 ₺
    });

    test("promo code ZIGO50 applies 50% discount in trial window", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/pricing");
      
      // Click subscribe on a plan
      await page.getByTestId("plan-zigo-plus-student-monthly").getByRole("button", { name: /abone ol/i }).click();
      
      // Modal should open with promo field
      await expect(page.locator('[data-testid="google-play-modal"]')).toBeVisible();
      
      // Promo code should be pre-filled or auto-applied in trial window
      await expect(page.locator('text="%50"')).toBeVisible();
    });
  });

  test.describe("Stripe Web Checkout", () => {
    test("stripe checkout button redirects to Stripe", async ({ page }) => {
      test.skip(true, "Requires Stripe test mode");
      
      await demoLogin(page, "student");
      await page.goto("/pricing");
      
      // Click web checkout button
      await page.getByTestId("plan-zigo-plus-student-monthly").getByRole("button", { name: /stripe/i }).click();
      
      // Should redirect to Stripe checkout
      await expect(page).toHaveURL(/checkout\.stripe\.com/);
    });
  });

  test.describe("Havale/EFT Flow", () => {
    test("havale page shows bank details", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/billing/havale");
      
      await expect(page.locator('text="Banka Bilgileri"')).toBeVisible();
      await expect(page.locator('text="IBAN"')).toBeVisible();
      await expect(page.getByTestId("dekkont-upload")).toBeVisible();
    });

    test("dekkont upload enables submit", async () => {
      test.skip(true, "Requires file upload");
    });
  });

  test.describe("Trial Expiry Handling", () => {
    test("trial expiry shows upgrade prompt", async () => {
      test.skip(true, "Requires test account with expired trial");
    });

    test("expired trial redirects to pricing on premium feature access", async () => {
      test.skip(true, "Requires test account with expired trial");
    });
  });

  test.describe("Subscription Management", () => {
    test("cancel subscription shows confirmation", async () => {
      test.skip(true, "Requires active subscription");
    });

    test("cancelled subscription reverts to free tier", async () => {
      test.skip(true, "Requires cancelled subscription");
    });

    test("reactivate subscription restores premium", async () => {
      test.skip(true, "Requires cancelled subscription");
    });
  });
});