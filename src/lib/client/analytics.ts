"use client";

/* global window */

import posthog from "posthog-js";

let initialized = false;

/** Initializes PostHog once; no-op unless NEXT_PUBLIC_POSTHOG_KEY is configured. */
export function initAnalytics(): void {
  if (initialized || typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  try {
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",
      capture_pageview: true,
      capture_pageleave: true,
      persistence: "localStorage+cookie",
      autocapture: false,
    });
    initialized = true;
  } catch {
    // never block the app on analytics
  }
}

/** Safe event tracking — no-op unless analytics is initialized. */
export function trackEvent(name: string, properties?: Record<string, unknown>): void {
  if (!initialized || typeof window === "undefined") return;
  try {
    posthog.capture(name, properties);
  } catch {
    // analytics must never break the app
  }
}
