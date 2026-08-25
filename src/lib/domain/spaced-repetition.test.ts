import { describe, expect, it } from "vitest";

import {
  applyReview,
  dueDateFrom,
  initialReviewState,
  MIN_EASE_FACTOR,
} from "@/lib/domain/spaced-repetition";

describe("applyReview", () => {
  it("resets streak and schedules tomorrow on unknown", () => {
    const grown = applyReview(initialReviewState(), true);
    const reset = applyReview(grown, false);
    expect(reset.repetitions).toBe(0);
    expect(reset.intervalDays).toBe(0);
    expect(reset.nextIntervalDays).toBe(1);
  });

  it("first correct answer is due in 1 day", () => {
    const next = applyReview(undefined, true);
    expect(next.repetitions).toBe(1);
    expect(next.nextIntervalDays).toBe(1);
  });

  it("second correct answer is due in 6 days", () => {
    const first = applyReview(undefined, true);
    const second = applyReview(first, true);
    expect(second.nextIntervalDays).toBe(6);
  });

  it("later intervals grow by ease factor", () => {
    let state = applyReview(undefined, true);
    state = applyReview(state, true);
    const third = applyReview(state, true);
    expect(third.nextIntervalDays).toBeGreaterThanOrEqual(7);
    // ease stays at default when always correct (quality 4 keeps it stable-ish)
    expect(third.easeFactor).toBeGreaterThanOrEqual(MIN_EASE_FACTOR);

    const fourth = applyReview(third, true);
    expect(fourth.nextIntervalDays).toBeGreaterThan(third.nextIntervalDays);
  });

  it("ease factor never drops below the floor", () => {
    let state = applyReview(undefined, true);
    for (let i = 0; i < 20; i++) {
      state = applyReview(state, false); // wrong resets but never lowers EF in this mapping
      state = applyReview(state, true);
    }
    expect(state.easeFactor).toBeGreaterThanOrEqual(MIN_EASE_FACTOR);
  });
});

describe("dueDateFrom", () => {
  it("rolls to early morning and never returns a past timestamp", () => {
    const now = new Date("2026-08-24T22:30:00Z");
    const due = dueDateFrom(now, 1);
    expect(due.getTime()).toBeGreaterThan(now.getTime());
    expect(due.getHours()).toBe(4); // local early-morning rollover
  });
});
