import { describe, expect, it, vi } from "vitest";

import {
  isGooglePlayBillingAvailable,
  purchaseGooglePlaySubscription,
  restoreGooglePlayPurchases,
} from "./google-play-billing";

describe("google-play-billing bridge", () => {
  it("uses the Capacitor ZigoPlayBilling bridge when running on Android", async () => {
    const plugin = {
      purchaseSubscription: vi.fn().mockResolvedValue({
        productId: "zigo_plus",
        planId: "student-monthly",
        purchaseToken: "token_123",
        orderId: "GPA.123",
        packageName: "com.zigo.education",
      }),
    };

    const originalWindow = globalThis.window;
    Object.defineProperty(globalThis, "window", {
      value: {
        Capacitor: { isNativePlatform: () => true },
        ZigoPlayBilling: plugin,
      },
      configurable: true,
    });

    try {
      expect(isGooglePlayBillingAvailable()).toBe(true);
      const result = await purchaseGooglePlaySubscription({ productId: "zigo_plus", planId: "student-monthly" });
      expect(plugin.purchaseSubscription).toHaveBeenCalledWith({ productId: "zigo_plus", planId: "student-monthly" });
      expect(result).toEqual({
        productId: "zigo_plus",
        planId: "student-monthly",
        purchaseToken: "token_123",
        orderId: "GPA.123",
        packageName: "com.zigo.education",
      });
    } finally {
      if (originalWindow === undefined) {
        delete (globalThis as { window?: unknown }).window;
      } else {
        Object.defineProperty(globalThis, "window", { value: originalWindow, configurable: true });
      }
    }
  });

  it("defaults packageName to com.zigo.education if bridge omits it", async () => {
    const plugin = {
      purchaseSubscription: vi.fn().mockResolvedValue({
        productId: "zigo_plus",
        planId: "student-monthly",
        purchaseToken: "token_456",
        orderId: "GPA.456",
      }),
    };

    const originalWindow = globalThis.window;
    Object.defineProperty(globalThis, "window", {
      value: {
        Capacitor: {
          Plugins: {
            ZigoPlayBilling: plugin,
          },
        },
      },
      configurable: true,
    });

    try {
      expect(isGooglePlayBillingAvailable()).toBe(true);
      const result = await purchaseGooglePlaySubscription({ productId: "zigo_plus", planId: "student-monthly" });
      expect(result.packageName).toBe("com.zigo.education");
      expect(result.purchaseToken).toBe("token_456");
    } finally {
      if (originalWindow === undefined) {
        delete (globalThis as { window?: unknown }).window;
      } else {
        Object.defineProperty(globalThis, "window", { value: originalWindow, configurable: true });
      }
    }
  });

  it("falls back to NativePurchases plugin when ZigoPlayBilling is not present", async () => {
    const nativePlugin = {
      purchaseProduct: vi.fn().mockResolvedValue({
        productIdentifier: "zigo_plus_monthly",
        purchaseToken: "native_token_789",
        transactionId: "GPA.789",
      }),
    };

    const originalWindow = globalThis.window;
    Object.defineProperty(globalThis, "window", {
      value: {
        Capacitor: {
          Plugins: {
            NativePurchases: nativePlugin,
          },
        },
      },
      configurable: true,
    });

    try {
      expect(isGooglePlayBillingAvailable()).toBe(true);
      const result = await purchaseGooglePlaySubscription({ productId: "zigo_plus", planId: "student-monthly" });
      expect(nativePlugin.purchaseProduct).toHaveBeenCalledWith({
        productIdentifier: "zigo_plus",
        planIdentifier: "student-monthly",
      });
      expect(result).toEqual({
        productId: "zigo_plus_monthly",
        planId: "student-monthly",
        purchaseToken: "native_token_789",
        orderId: "GPA.789",
        packageName: "com.zigo.education",
      });
    } finally {
      if (originalWindow === undefined) {
        delete (globalThis as { window?: unknown }).window;
      } else {
        Object.defineProperty(globalThis, "window", { value: originalWindow, configurable: true });
      }
    }
  });

  it("returns false and throws when no bridge is available", async () => {
    const originalWindow = globalThis.window;
    Object.defineProperty(globalThis, "window", {
      value: {},
      configurable: true,
    });

    try {
      expect(isGooglePlayBillingAvailable()).toBe(false);
      await expect(
        purchaseGooglePlaySubscription({ productId: "zigo_plus", planId: "student-monthly" }),
      ).rejects.toThrow("Google Play Billing bridge is unavailable on this device.");

      const restored = await restoreGooglePlayPurchases();
      expect(restored).toEqual([]);
    } finally {
      if (originalWindow === undefined) {
        delete (globalThis as { window?: unknown }).window;
      } else {
        Object.defineProperty(globalThis, "window", { value: originalWindow, configurable: true });
      }
    }
  });
});
