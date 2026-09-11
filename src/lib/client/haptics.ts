/**
 * haptics.ts
 * Zigo — Native haptic feedback triggers for touch interactions.
 * Covers social interactions (like, bookmark, swipe) and game events
 * (correct answer, wrong answer, streak, level-up, perfect score).
 */

export type HapticType =
  | "light"
  | "medium"
  | "heavy"
  | "double"
  | "success"
  | "wrong"
  | "streak"
  | "level_up"
  | "perfect"
  | "coin";

export function triggerHaptic(type: HapticType = "light") {
  if (typeof window === "undefined" || !("vibrate" in navigator)) return;

  try {
    switch (type) {
      // ── Genel UI etkileşimleri ───────────────────────────────────────
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

      // ── Oyun başarı olayları ─────────────────────────────────────────
      case "success":
        // Doğru cevap: kısa iki darbe
        navigator.vibrate([10, 30, 15, 30, 20]);
        break;

      case "wrong":
        // Yanlış cevap: iki sert eşit darbe
        navigator.vibrate([40, 0, 40]);
        break;

      case "streak":
        // Seri: artan yoğunlukta beş darbe (momentum hissi)
        navigator.vibrate([10, 20, 15, 20, 20, 20, 25, 20, 30, 20, 35]);
        break;

      case "level_up":
        // Seviye atlama: üçlü güçlü kutlama
        navigator.vibrate([30, 50, 30, 50, 60]);
        break;

      case "perfect":
        // Mükemmel skor: crescendo — giderek güçlenen darbeler
        navigator.vibrate([10, 20, 20, 20, 30, 20, 40, 20, 50]);
        break;

      case "coin":
        // Puan/jeton kazanma: hafif çift tik
        navigator.vibrate([8, 20, 12]);
        break;
    }
  } catch {
    // Browser policy tarafından engellenirse sessizce atla
  }
}
