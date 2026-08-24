"use client";

import { useEffect } from "react";

import { initAnalytics } from "@/lib/client/analytics";

/**
 * Env-gated product analytics (PostHog). Side-effect-only provider: stays
 * inert until NEXT_PUBLIC_POSTHOG_KEY (+ optional NEXT_PUBLIC_POSTHOG_HOST)
 * are configured in the environment.
 */
export function AnalyticsProvider() {
  useEffect(() => {
    initAnalytics();
  }, []);

  return null;
}
