/** Focus-Gamification for Students — Pomodoro study loop. */

export const POMODORO_SECONDS = 25 * 60;
export const POMODORO_MINUTES = 25;
export const FOCUS_SESSION_POINTS = 15;

export const FOCUS_PRODUCT_POSITIONING = {
  niche: "Focus-Gamification for Students",
  tagline: "Turn every 25-minute focus block into progress you can share.",
  studyWithMe: "Study-with-me",
} as const;

export const ZIGO_PLUS_BENEFITS = [
  "Veli ve öğrenci için gelişmiş öğrenme analitiği",
  "Eğitim alanlarına uygun kişisel çalışma planları",
  "Reklamsız, dikkat dağıtmayan odak modu",
  "Doğrulanmış öğretmenlerden YKS/LGS yazılı hazırlık kaynakları",
] as const;

export function formatPomodoroCountdown(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function pomodoroProgress(elapsedSeconds: number, targetSeconds = POMODORO_SECONDS) {
  if (targetSeconds <= 0) return 0;
  return Math.min(100, (elapsedSeconds / targetSeconds) * 100);
}
