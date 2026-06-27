"use client";

type AnalyticsEvent = {
  name: string;
  properties?: Record<string, string | number | boolean | null>;
};

declare global {
  interface Window {
    posthog?: { capture: (name: string, props?: Record<string, unknown>) => void };
    gtag?: (...args: unknown[]) => void;
  }
}

function analyticsAllowed() {
  try {
    return window.localStorage.getItem("zigo:cookie-consent") === "accepted";
  } catch {
    return false;
  }
}

export function trackEvent(event: AnalyticsEvent) {
  if (typeof window === "undefined" || !analyticsAllowed()) return;

  try {
    window.posthog?.capture(event.name, event.properties);
  } catch {
    // ignore
  }

  try {
    window.gtag?.("event", event.name, event.properties ?? {});
  } catch {
    // ignore
  }
}

export function trackPageView(path: string) {
  trackEvent({ name: "page_view", properties: { path } });
}

export function trackFunnelStep(step: string, meta?: Record<string, string | number | boolean | null>) {
  trackEvent({ name: "funnel_step", properties: { step, ...meta } });
}
