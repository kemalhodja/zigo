import { expect, test } from "@playwright/test";

test.describe("PWA assets", () => {
  test("offline fallback page loads", async ({ page }) => {
    const response = await page.goto("/offline.html");
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator("body")).toContainText(/offline|çevrim|connection/i);
  });

  test("web manifest is served", async ({ request }) => {
    const response = await request.get("/manifest.json");
    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as { name?: string; icons?: unknown[] };
    expect(body.name).toBeTruthy();
    expect(Array.isArray(body.icons)).toBeTruthy();
  });

  test("service worker script is reachable", async ({ request }) => {
    const response = await request.get("/sw.js");
    expect(response.status()).toBeLessThan(500);
  });
});
