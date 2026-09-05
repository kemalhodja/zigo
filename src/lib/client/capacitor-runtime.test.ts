import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { isCapacitorAndroidClient, isCapacitorClient } from "./capacitor-runtime";

describe("capacitor-runtime", () => {
  const originalWindow = globalThis.window;
  const originalNavigator = globalThis.navigator;

  beforeEach(() => {
    // Reset window
  });

  afterEach(() => {
    if (originalWindow === undefined) {
      delete (globalThis as { window?: unknown }).window;
    } else {
      Object.defineProperty(globalThis, "window", { value: originalWindow, configurable: true });
    }
    if (originalNavigator === undefined) {
      delete (globalThis as { navigator?: unknown }).navigator;
    } else {
      Object.defineProperty(globalThis, "navigator", { value: originalNavigator, configurable: true });
    }
  });

  it("identifies native Capacitor Android container", () => {
    Object.defineProperty(globalThis, "window", {
      value: {
        Capacitor: {
          getPlatform: () => "android",
          isNativePlatform: () => true,
        },
        location: { search: "" },
      },
      configurable: true,
    });

    expect(isCapacitorAndroidClient()).toBe(true);
    expect(isCapacitorClient()).toBe(true);
  });

  it("does NOT treat regular Android web browser as Capacitor native container", () => {
    Object.defineProperty(globalThis, "window", {
      value: {
        location: { search: "" },
      },
      configurable: true,
    });
    Object.defineProperty(globalThis, "navigator", {
      value: {
        userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/128.0 Mobile Safari/537.36",
      },
      configurable: true,
    });

    expect(isCapacitorAndroidClient()).toBe(false);
    expect(isCapacitorClient()).toBe(false);
  });

  it("recognizes ?android query parameter for developer/testing override", () => {
    Object.defineProperty(globalThis, "window", {
      value: {
        location: { search: "?android=true" },
      },
      configurable: true,
    });
    Object.defineProperty(globalThis, "navigator", {
      value: { userAgent: "Mozilla/5.0 Chrome/128" },
      configurable: true,
    });

    expect(isCapacitorAndroidClient()).toBe(true);
  });

  it("recognizes Capacitor custom user agent inside Android webview", () => {
    Object.defineProperty(globalThis, "window", {
      value: {
        location: { search: "" },
      },
      configurable: true,
    });
    Object.defineProperty(globalThis, "navigator", {
      value: {
        userAgent: "Mozilla/5.0 (Linux; U; Android 14; Mobile; Capacitor/7.0.0)",
      },
      configurable: true,
    });

    expect(isCapacitorAndroidClient()).toBe(true);
  });
});
