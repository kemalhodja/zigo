import { expect, test } from "@playwright/test";

import { DEMO_ACCOUNTS, DEMO_PASSWORD, demoLogin, isDemoAuthAvailable } from "./helpers";

test.describe("Billing — Havale / EFT", () => {
  test.beforeEach(async ({ request }) => {
    test.skip(!(await isDemoAuthAvailable(request)), "Live Supabase demo auth is required.");
  });

  test("student can open havale checkout and create a transfer request", async ({ page }) => {
    await demoLogin(page, "student");
    await page.goto("/billing/havale?planId=student-monthly");

    await expect(page.getByRole("heading", { name: /Havale \/ EFT/i })).toBeVisible();
    await page.getByRole("button", { name: /Havale bilgilerini göster/i }).click();

    await expect(page.getByText("Banka bilgileri")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/ZIGO-/)).toBeVisible();
    await expect(page.getByText(/TR/i)).toBeVisible();
  });

  test("bank transfer API creates pending request with reference code", async ({ page, request }) => {
    await demoLogin(page, "student");

    const response = await request.post("/api/billing/bank-transfer", {
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

  test("stripe checkout stays disabled when stripe is not configured", async ({ page, request }) => {
    await demoLogin(page, "student");

    const response = await request.post("/api/billing/checkout", {
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

    const havaleLink = page.getByRole("link", { name: /Havale \/ EFT/i }).first();
    await expect(havaleLink).toBeVisible({ timeout: 15_000 });
    await expect(havaleLink).toHaveAttribute("href", /\/billing\/havale\?planId=/);
  });
});
