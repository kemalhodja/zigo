/**
 * Push notification scaffold for Capacitor/PWA.
 * Wire Firebase or OneSignal when production keys are available.
 */

export type PushTopic = "learning_reminder" | "parent_approval" | "focus_streak";

export function isPushConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_PUSH_VAPID_KEY?.trim());
}

export function getPushTopicsForRole(role: "student" | "parent" | "teacher") {
  if (role === "parent") return ["parent_approval", "focus_streak"] as PushTopic[];
  if (role === "teacher") return ["learning_reminder"] as PushTopic[];
  return ["learning_reminder", "focus_streak"] as PushTopic[];
}
