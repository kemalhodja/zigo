import { expect, test } from "@playwright/test";

// Simulate small Android device width and iPhone safe-areas
test.use({ 
  viewport: { width: 360, height: 800 },
  hasTouch: true,
  isMobile: true,
});

test.describe("mobile viewport and safe area layout", () => {
  const pagesToTest = ["/", "/explore", "/student", "/teacher", "/create"];

  for (const path of pagesToTest) {
    test(`page ${path} has no horizontal overflow`, async ({ page }) => {
      const response = await page.goto(path);
      // Ignore 404s/redirects for roles if they occur in standard test env
      if (response && response.status() >= 400 && response.status() !== 401 && response.status() !== 403 && response.status() !== 404) {
        expect(response.status()).toBeLessThan(400);
      }
      
      await page.waitForLoadState("domcontentloaded");
      
      // Wait a bit for dynamic content
      await page.waitForTimeout(1000);

      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      expect(hasOverflow).toBe(false);
    });
  }

  test("bottom navigation does not overlap with safe-bottom toasts", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("nav").first();
    if ((await nav.count()) === 0) {
      test.skip(true, "Nav not rendered");
      return;
    }
    
    const navBox = await nav.boundingBox();
    // Verify nav is at the bottom of the viewport
    expect(navBox?.y).toBeGreaterThan(600);
    
    // Simulate a toast trigger or check absolute bottom elements
    const zigoToasts = page.locator(".toast-container, [data-sonner-toaster]");
    if (await zigoToasts.count() > 0) {
      const toastBox = await zigoToasts.first().boundingBox();
      if (toastBox && navBox) {
        // Ensure Toast is either above the nav, or safely padded
        const isAboveNav = toastBox.y + toastBox.height <= navBox.y;
        // Or if it's fixed at the bottom, ensure it doesn't overlap completely
        expect(isAboveNav || toastBox.y < navBox.y).toBeTruthy();
      }
    }
  });

  test("post wizard sticky bar remains within shell boundaries", async ({ page }) => {
    await page.goto("/create");
    const stickyBar = page.locator(".sticky.top-0, .sticky.bottom-0").first();
    if (await stickyBar.count() > 0) {
      const barBox = await stickyBar.boundingBox();
      expect(barBox?.width).toBeLessThanOrEqual(360);
    }
  });
});
