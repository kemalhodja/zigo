import { expect, test } from "@playwright/test";

import { dismissAppIntro } from "./helpers";

const BASE = process.env.E2E_BASE_URL ?? "https://zigo-kohl.vercel.app";
const PASS = "ZigoTest2026!Secure";

test.describe("registration flow UI verification", () => {
  test.beforeEach(async ({ page }) => {
    await dismissAppIntro(page);
  });

  test("new sign-up shows trial message and campaign modal when available", async ({ page }) => {
    const email = `ui-verify-${Date.now()}@gmail.com`;

    await page.goto(`${BASE}/auth`);
    await page.getByTestId("auth-mode-sign-up").click();
    await page.getByPlaceholder("Zigo Kullanıcı").fill("UI Verify User");
    await page.getByPlaceholder("sen@ornek.com").fill(email);
    await page.getByPlaceholder(/en az|password/i).fill(PASS);
    await page.getByTestId("registration-account-student").click();

    const signUpResponse = page.waitForResponse(
      (response) => response.url().includes("/api/auth/sign-up") && response.status() === 200,
      { timeout: 30_000 },
    );
    await page.getByRole("button", { name: /hesap oluştur|create account/i }).click();
    const response = await signUpResponse;
    const body = (await response.json()) as { message?: string };
    expect(body.message ?? "").toMatch(/7 gün|trial|deneme/i);

    await page.waitForURL(/\/onboarding/, { timeout: 30_000 });

    await page.evaluate(() => {
      sessionStorage.setItem("zigo:announce-campaigns", "1");
      localStorage.setItem("zigo:app-intro-seen", "1");
      localStorage.removeItem("zigo:registration-campaigns-seen");
    });

    await page.goto(`${BASE}/`);
    await page.waitForLoadState("networkidle");

    const campaignModal = page.getByTestId("registration-campaign-announcement");
    const modalCount = await campaignModal.count();
    if (modalCount > 0) {
      await expect(campaignModal).toBeVisible();
      await page.getByRole("button", { name: /akışa devam|continue to feed/i }).click();
    }

    await page.goto(`${BASE}/billing/havale`);
    await expect(page.locator("body")).toContainText(/Zigo Plus|deneme|trial|gün/i);
  });
});
