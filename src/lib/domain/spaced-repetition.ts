/**
 * SM-2 spaced repetition (SuperMemo-2) — pure scheduling math.
 *
 * Quality mapping for a two-button review flow:
 *  - "known"   → q = 4  (correct with some effort)
 *  - "unknown" → q = 1  (wrong / blank)
 */

export const MIN_EASE_FACTOR = 1.3;
const DEFAULT_EASE_FACTOR = 2.5;

export type ReviewScheduleState = {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
};

export type ScheduledReview = ReviewScheduleState & {
  /** Days until the next review. */
  nextIntervalDays: number;
};

export function initialReviewState(): ReviewScheduleState {
  return { easeFactor: DEFAULT_EASE_FACTOR, intervalDays: 0, repetitions: 0 };
}

function clampEase(ease: number): number {
  return Math.max(MIN_EASE_FACTOR, Math.round(ease * 100) / 100);
}

/**
 * Applies the SM-2 update for one answer.
 * - Wrong answers reset the learning streak and schedule the card for tomorrow.
 * - Correct answers grow the interval 1d → 6d → interval × ease.
 */
export function applyReview(
  state: ReviewScheduleState | undefined,
  known: boolean,
): ScheduledReview {
  const current = state ?? initialReviewState();

  if (!known) {
    return {
      easeFactor: current.easeFactor,
      intervalDays: 0,
      repetitions: 0,
      nextIntervalDays: 1,
    };
  }

  const quality = 4;
  const rawEase =
    current.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  const easeFactor = clampEase(rawEase);
  const repetitions = current.repetitions + 1;

  let nextIntervalDays: number;
  if (repetitions === 1) {
    nextIntervalDays = 1;
  } else if (repetitions === 2) {
    nextIntervalDays = 6;
  } else {
    nextIntervalDays = Math.max(
      7,
      Math.round((current.intervalDays || 6) * easeFactor),
    );
  }

  return { easeFactor, intervalDays: nextIntervalDays, repetitions, nextIntervalDays };
}

export function dueDateFrom(now: Date, intervalDays: number): Date {
  const due = new Date(now.getTime());
  due.setDate(due.getDate() + Math.max(0, intervalDays));
  due.setHours(4, 0, 0, 0); // early-morning rollover
  if (due.getTime() <= now.getTime()) {
    due.setDate(due.getDate() + 1);
  }
  return due;
}
