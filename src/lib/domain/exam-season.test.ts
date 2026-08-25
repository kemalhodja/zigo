import { describe, expect, it } from "vitest";

import {
  formatDaysRemaining,
  getNextExams,
  seasonPhase,
} from "@/lib/domain/exam-season";

describe("getNextExams", () => {
  it("skips past exams and returns nearest upcoming ones in order", () => {
    const now = new Date("2026-08-24T12:00:00Z"); // after all 2026 exams
    const next = getNextExams(now);
    expect(next[0].key).toBe("lgs");
    expect(next[0].year).toBe(2027);
    expect(next[0].daysRemaining).toBeGreaterThan(0);
    expect(next[1].key).toBe("yks");
    expect(next[1].daysRemaining).toBeGreaterThanOrEqual(next[0].daysRemaining);
  });

  it("counts down within the same year before the exam", () => {
    const now = new Date("2026-05-01T09:00:00Z");
    const next = getNextExams(now, 1);
    expect(next[0].shortName).toBe("LGS");
    expect(next[0].daysRemaining).toBeGreaterThan(30);
    expect(next[0].daysRemaining).toBeLessThan(60);
  });
});

describe("formatDaysRemaining", () => {
  it("special-cases the final day", () => {
    expect(formatDaysRemaining(1)).toContain("son gün");
    expect(formatDaysRemaining(42)).toBe("42 gün");
  });
});

describe("seasonPhase", () => {
  it("escalates tone as exam approaches", () => {
    expect(seasonPhase(200).label).not.toBe(seasonPhase(90).label);
    expect(seasonPhase(15).label).toBe("Final Sprint");
    expect(seasonPhase(60).label).toBe("Yoğun Tempo");
  });
});
