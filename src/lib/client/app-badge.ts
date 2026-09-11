/**
 * Utilities for App Icon Badge management.
 * Supports W3C Badging API (PWA, mobile Chrome, Edge) and falls back safely.
 */

export async function setAppBadgeCount(count: number): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    if ("setAppBadge" in navigator && typeof navigator.setAppBadge === "function") {
      if (count > 0) {
        await navigator.setAppBadge(count);
      } else {
        await navigator.clearAppBadge();
      }
      return true;
    }
  } catch (err) {
    // Non-fatal, older browsers or permissions denied
    console.debug("[APP_BADGE] Unable to set app badge:", err);
  }

  return false;
}

export async function clearAppBadgeCount(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    if ("clearAppBadge" in navigator && typeof navigator.clearAppBadge === "function") {
      await navigator.clearAppBadge();
      return true;
    }
  } catch (err) {
    console.debug("[APP_BADGE] Unable to clear app badge:", err);
  }

  return false;
}
