/**
 * haptics.ts
 * Subtle native haptic feedback triggers for touch interactions (Double Tap, Like, Bookmark, Swipe).
 */

export function triggerHaptic(type: "light" | "medium" | "heavy" | "double" | "success" = "light") {
  if (typeof window === "undefined" || !("vibrate" in navigator)) return;

  try {
    switch (type) {
      case "light":
        navigator.vibrate(10);
        break;
      case "medium":
        navigator.vibrate(25);
        break;
      case "heavy":
        navigator.vibrate(45);
        break;
      case "double":
        navigator.vibrate([15, 40, 20]);
        break;
      case "success":
        navigator.vibrate([10, 30, 15, 30, 20]);
        break;
    }
  } catch {
    // Ignore if blocked by browser policy
  }
}
