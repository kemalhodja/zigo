import { expect, test } from "@playwright/test";

import { DEMO_ACCOUNTS, DEMO_PASSWORD,demoLogin, isDemoAuthAvailable } from "../helpers";

test.describe("Authentication Critical Paths", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ request }, testInfo) => {
    if (!(await isDemoAuthAvailable(request))) {
      testInfo.skip(true, "Live Supabase demo auth unavailable");
    }
  });

  test.describe("Sign Up Flow", () => {
    test("new user signup with email/password", async ({ page }) => {
      const testEmail = `test_${Date.now()}@zigo.test`;
      
      await page.goto("/auth");
      await page.getByTestId("sign-up-tab").click();
      
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', "TestPass123!");
      await page.fill('input[name="confirmPassword"]', "TestPass123!");
      
      await Promise.all([
        page.waitForResponse(r => r.url().includes("/api/auth/sign-up") && r.ok()),
        page.getByTestId("submit-signup").click(),
      ]);
      
      // Should redirect to role setup
      await expect(page).toHaveURL(/\/onboarding\/role-setup/);
      await expect(page.locator("h1")).toContainText("Rol Seç");
    });

    test("signup with existing email shows error", async ({ page }) => {
      await page.goto("/auth");
      await page.getByTestId("sign-up-tab").click();
      
      await page.fill('input[name="email"]', DEMO_ACCOUNTS.student);
      await page.fill('input[name="password"]', "TestPass123!");
      await page.fill('input[name="confirmPassword"]', "TestPass123!");
      
      await page.getByTestId("submit-signup").click();
      
      await expect(page.getByText(/zaten kayıtlı|already exists/i)).toBeVisible();
    });
  });

  test.describe("Login Flow", () => {
    test("student login redirects to home feed", async ({ page }) => {
      await page.goto("/auth");
      await page.fill('input[name="email"]', DEMO_ACCOUNTS.student);
      await page.fill('input[name="password"]', DEMO_PASSWORD);
      
      await Promise.all([
        page.waitForResponse(r => r.url().includes("/api/auth/sign-in") && r.ok()),
        page.getByTestId("submit-login").click(),
      ]);
      
      await expect(page).not.toHaveURL(/\/auth/);
      await expect(page.locator("#main-content")).toBeVisible();
    });

    test("login with wrong password shows error", async ({ page }) => {
      await page.goto("/auth");
      await page.fill('input[name="email"]', DEMO_ACCOUNTS.student);
      await page.fill('input[name="password"]', "WrongPassword123!");
      
      await page.getByTestId("submit-login").click();
      
      await expect(page.getByText(/şifre yanlış|invalid credentials/i)).toBeVisible();
    });

    test("unverified email shows verification prompt", async ({ page }) => {
      const testEmail = `unverified_${Date.now()}@zigo.test`;
      
      await page.goto("/auth");
      await page.getByTestId("sign-up-tab").click();
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', "TestPass123!");
      await page.fill('input[name="confirmPassword"]', "TestPass123!");
      
      await Promise.all([
        page.waitForResponse(r => r.url().includes("/api/auth/sign-up") && r.ok()),
        page.getByTestId("submit-signup").click(),
      ]);
      
      // Should be on role-setup but unverified
      await expect(page).toHaveURL(/\/onboarding\/role-setup/);
      
      // Try to access protected route
      await page.goto("/student");
      await expect(page).toHaveURL(/\/auth\/verify-email/);
    });
  });

  test.describe("Role Selection", () => {
    test("student role selection completes onboarding", async ({ page }) => {
      await demoLogin(page, "student");
      
      if (await page.locator('[data-testid="role-selection"]').count() > 0) {
        await page.getByTestId("role-student").click();
        await page.getByTestId("confirm-role").click();
        
        await expect(page).toHaveURL(/\/student/);
      }
    });

    test("parent role selection shows family setup", async ({ page }) => {
      await demoLogin(page, "parent");
      
      if (await page.locator('[data-testid="role-selection"]').count() > 0) {
        await page.getByTestId("role-parent").click();
        await page.getByTestId("confirm-role").click();
        
        await expect(page).toHaveURL(/\/family/);
      }
    });

    test("teacher role shows studio setup", async ({ page }) => {
      await demoLogin(page, "teacher");
      
      if (await page.locator('[data-testid="role-selection"]').count() > 0) {
        await page.getByTestId("role-teacher").click();
        await page.getByTestId("confirm-role").click();
        
        await expect(page).toHaveURL(/\/teacher/);
      }
    });
  });

  test.describe("Session Management", () => {
    test("session persists after page reload", async ({ page }) => {
      await demoLogin(page, "student");
      await page.reload();
      
      await expect(page).not.toHaveURL(/\/auth/);
      await expect(page.locator("#main-content")).toBeVisible();
    });

    test("logout clears session", async ({ page }) => {
      await demoLogin(page, "student");
      await page.getByTestId("logout-button").click();
      
      await expect(page).toHaveURL(/\/auth/);
    });
  });
});