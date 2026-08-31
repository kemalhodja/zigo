/**
 * PostHog funnel: signup → role → trial → paywall → purchase
 * Her adım tek event ismi ile izlenir, dashboard'da funnel oluşturulur.
 */

export const FUNNEL = {
  SIGNUP_COMPLETED: "signup_completed",
  ROLE_SELECTED: "role_selected",
  TRIAL_STARTED: "trial_started",
  PAYWALL_VIEWED: "paywall_viewed",
  PAYWALL_CLICKED: "paywall_clicked",
  PURCHASE_STARTED: "purchase_started",
  PURCHASE_COMPLETED: "purchase_completed",
  TRIAL_EXPIRED: "trial_expired",
} as const;

export type FunnelEvent = typeof FUNNEL[keyof typeof FUNNEL];

export type FunnelProps = Record<string, string | number | boolean | null | undefined>;
