import { describe, expect, it, vi } from "vitest";

import { purchaseGooglePlaySubscription } from "./google-play-billing";

describe("purchaseGooglePlaySubscription", () => {
  it("uses the Capacitor ZigoPlayBilling bridge when running on Android", async () => {
    const plugin = {
      purchaseSubscription: vi.fn().mockResolvedValue({
        productId: "zigo_plus",
        planId: "student-monthly",
        purchaseToken: "token_123",
        orderId: "GPA.123",
        packageName: "com.zigo.app",
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
      const result = await purchaseGooglePlaySubscription({ productId: "zigo_plus", planId: "student-monthly" });
      expect(plugin.purchaseSubscription).toHaveBeenCalledWith({ productId: "zigo_plus", planId: "student-monthly" });
      expect(result).toEqual({
        productId: "zigo_plus",
        planId: "student-monthly",
        purchaseToken: "token_123",
        orderId: "GPA.123",
        packageName: "com.zigo.app",
      });
    } finally {
      if (originalWindow === undefined) {
        delete (globalThis as { window?: unknown }).window;
      } else {
        Object.defineProperty(globalThis, "window", { value: originalWindow, configurable: true });
      }
    }
  });
});
