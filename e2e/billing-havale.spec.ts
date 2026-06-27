import { expect, test } from "@playwright/test";

import { demoLogin, isDemoAuthAvailable } from "./helpers";

test.describe("Billing — Havale / EFT", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ request }) => {
    test.skip(!(await isDemoAuthAvailable(request)), "Live Supabase demo auth is required.");
  });

  test("student can open havale checkout and create a transfer request", async ({ page }) => {
    await demoLogin(page, "student");

    const apiResponse = await page.request.post("/api/billing/bank-transfer", {
      data: { planId: "student-monthly" },
    });
    if (apiResponse.status() === 503) {
      test.skip(true, "ZIGO_BANK_IBAN is not configured on this environment.");
    }
    expect(apiResponse.ok()).toBeTruthy();

    await page.goto("/billing/havale?planId=student-monthly");
    await expect(page.getByRole("heading", { name: /Havale \/ EFT/i })).toBeVisible();
    await expect(page.getByText(/^ZIGO-[A-F0-9]+$/)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/^TR\d{2}/).first()).toBeVisible();
  });

  test("bank transfer API creates pending request with reference code", async ({ page }) => {
    await demoLogin(page, "student");

    const response = await page.request.post("/api/billing/bank-transfer", {
      data: { planId: "student-monthly" },
    });

    if (response.status() === 503) {
      test.skip(true, "ZIGO_BANK_IBAN is not configured on this environment.");
    }

    expect(response.ok()).toBeTruthy();
    const payload = (await response.json()) as {
      data?: { request?: { reference_code?: string; status?: string }; bank?: { iban?: string } };
    };
    expect(payload.data?.request?.reference_code).toMatch(/^ZIGO-/);
    expect(payload.data?.request?.status).toBe("pending");
    expect(payload.data?.bank?.iban).toBeTruthy();
  });

  test("stripe checkout stays disabled when stripe is not configured", async ({ page }) => {
    await demoLogin(page, "student");

    const response = await page.request.post("/api/billing/checkout", {
      data: { planId: "student-monthly" },
    });

    expect(response.status()).toBe(503);
  });
});

test.describe("Billing — plan picker", () => {
  test.beforeEach(async ({ request }) => {
    test.skip(!(await isDemoAuthAvailable(request)), "Live Supabase demo auth is required.");
  });

  test("profile plans expose havale link on web", async ({ page }) => {
    await demoLogin(page, "student");
    await page.goto("/profile");

    const premiumBanner = page.getByText(/Zigo Plus aktif/i);
    if (await premiumBanner.isVisible().catch(() => false)) {
      test.skip(true, "Demo student already has Zigo Plus — plan picker hidden.");
    }

    const havaleLink = page.getByRole("link", { name: /Havale \/ EFT/i }).first();
    await expect(havaleLink).toBeVisible({ timeout: 15_000 });
    await expect(havaleLink).toHaveAttribute("href", /\/billing\/havale\?planId=/);
  });
});
