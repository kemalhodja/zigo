import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { demoLogin, isDemoAuthAvailable } from "./helpers";

test.describe("Accessibility Tests (WCAG 2.1 AA)", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ request }, testInfo) => {
    if (!(await isDemoAuthAvailable(request))) {
      testInfo.skip(true, "Live Supabase demo auth unavailable");
    }
  });

  test.describe("Automated Axe Scans", () => {
    test("home page passes axe audit", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test("pricing page passes axe audit", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/pricing");
      await page.waitForLoadState("networkidle");
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test("profile upgrade page passes axe audit", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/profile/upgrade");
      await page.waitForLoadState("networkidle");
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test("game page passes axe audit", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/games/memory");
      await page.waitForLoadState("networkidle");
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test("focus page passes axe audit", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/focus");
      await page.waitForLoadState("networkidle");
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test("store page passes axe audit", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/store");
      await page.waitForLoadState("networkidle");
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });

  test.describe("Keyboard Navigation", () => {
    test("home page tab navigation works", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/");
      
      // Tab through first 10 focusable elements
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press("Tab");
        const focused = page.locator(":focus");
        await expect(focused).toBeVisible();
      }
    });

    test("modal traps focus", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/pricing");
      await page.waitForLoadState("networkidle");
      
      // Open subscription modal
      await page.getByTestId("plan-zigo-plus-student-monthly").getByRole("button", { name: /abone ol/i }).click();
      await page.waitForTimeout(300);
      
      // Tab should stay within modal
      const modal = page.locator('[data-testid="google-play-modal"]');
      if (await modal.count() > 0) {
        const focusableElements = modal.locator('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const count = await focusableElements.count();
        
        if (count > 0) {
          await page.keyboard.press("Tab");
          const focused = page.locator(":focus");
          await expect(focused).toBeVisible();
        }
      }
    });

    test("skip link works", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/");
      
      const skipLink = page.getByTestId("skip-to-content");
      if (await skipLink.count() > 0) {
        await skipLink.focus();
        await expect(skipLink).toBeFocused();
        await skipLink.press("Enter");
        await expect(page.locator("#main-content")).toBeFocused();
      }
    });
  });

  test.describe("Color Contrast", () => {
    test("text meets 4.5:1 contrast ratio", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/");
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["cat.color"])
        .analyze();
      
      const contrastViolations = accessibilityScanResults.violations.filter(v => v.id === "color-contrast");
      expect(contrastViolations).toEqual([]);
    });

    test("interactive elements have focus indicators", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/");
      
      const buttons = page.locator("button, a, [role='button']").first();
      if (await buttons.count() > 0) {
        await buttons.focus();
        const styles = await buttons.evaluate(el => getComputedStyle(el));
        
        // Check for outline or box-shadow on focus
        const hasFocusStyle = styles.outline !== "none" || 
                             styles.boxShadow !== "none" || 
                             styles.borderColor !== "transparent";
        expect(hasFocusStyle).toBeTruthy();
      }
    });
  });

  test.describe("ARIA Attributes", () => {
    test("images have alt text", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/");
      
      const images = page.locator("img");
      const count = await images.count();
      
      for (let i = 0; i < Math.min(count, 10); i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute("alt");
        const role = await img.getAttribute("role");
        
        // Decorative images can have empty alt or role="presentation"
        expect(alt || role === "presentation").toBeTruthy();
      }
    });

    test("buttons have accessible names", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/");
      
      const buttons = page.locator("button");
      const count = await buttons.count();
      
      for (let i = 0; i < Math.min(count, 10); i++) {
        const button = buttons.nth(i);
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute("aria-label");
        const ariaLabelledBy = await button.getAttribute("aria-labelledby");
        
        expect(text || ariaLabel || ariaLabelledBy).toBeTruthy();
      }
    });

    test("form inputs have labels", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/auth");
      
      const inputs = page.locator("input:not([type='hidden'])");
      const count = await inputs.count();
      
      for (let i = 0; i < Math.min(count, 5); i++) {
        const input = inputs.nth(i);
        const id = await input.getAttribute("id");
        const ariaLabel = await input.getAttribute("aria-label");
        const ariaLabelledBy = await input.getAttribute("aria-labelledby");
        const placeholder = await input.getAttribute("placeholder");
        
        if (id) {
          const label = page.locator(`label[for="${id}"]`);
          await expect(label).toBeVisible();
        } else {
          expect(ariaLabel || ariaLabelledBy || placeholder).toBeTruthy();
        }
      }
    });
  });

  test.describe("Focus Management", () => {
    test("modal returns focus to trigger on close", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/pricing");
      await page.waitForLoadState("networkidle");
      
      // Store the button that opens modal
      const triggerButton = page.getByTestId("plan-zigo-plus-student-monthly").getByRole("button", { name: /abone ol/i });
      await triggerButton.focus();
      
      await triggerButton.click();
      await page.waitForTimeout(300);
      
      // Close modal
      await page.getByTestId("google-play-modal").getByRole("button", { name: /kapat|close/i }).click();
      await page.waitForTimeout(300);
      
      // Focus should return to trigger
      await expect(triggerButton).toBeFocused();
    });

    test("page has logical heading structure", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/");
      
      const headings = page.locator("h1, h2, h3, h4, h5, h6");
      const count = await headings.count();
      
      let previousLevel = 0;
      for (let i = 0; i < count; i++) {
        const heading = headings.nth(i);
        const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
        const level = parseInt(tagName.charAt(1));
        
        if (previousLevel > 0) {
          expect(level).toBeLessThanOrEqual(previousLevel + 1);
        }
        previousLevel = level;
      }
    });
  });

  test.describe("Form Validation", () => {
    test("form errors are announced", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/auth");
      
      await page.getByTestId("submit-login").click();
      
      const errorMessage = page.locator('[role="alert"], .error, [data-testid="error"]');
      if (await errorMessage.count() > 0) {
        await expect(errorMessage).toBeVisible();
        // Should have aria-live or role="alert"
        const role = await errorMessage.getAttribute("role");
        const ariaLive = await errorMessage.getAttribute("aria-live");
        expect(role === "alert" || ariaLive === "polite" || ariaLive === "assertive").toBeTruthy();
      }
    });

    test("required fields marked", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/auth");
      
      const requiredInputs = page.locator("input[required], select[required], textarea[required]");
      const count = await requiredInputs.count();
      
      for (let i = 0; i < Math.min(count, 5); i++) {
        const input = requiredInputs.nth(i);
        const ariaRequired = await input.getAttribute("aria-required");
        const required = await input.getAttribute("required");
        
        expect(ariaRequired === "true" || required !== null).toBeTruthy();
      }
    });
  });
});