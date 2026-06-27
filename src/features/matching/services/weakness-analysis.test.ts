import { describe, expect, it } from "vitest";

import {
  detectWeaknessesFromSessions,
  mergeRecentAssessmentSessions,
  scoreToWeaknessLevel,
  type AssessmentSession,
} from "./weakness-analysis.service";

const sessions: AssessmentSession[] = [
  {
    areaId: 1,
    areaName: "Üslü Sayılar",
    scorePercent: 40,
    source: "quiz",
    completedAt: "2026-06-24T10:00:00.000Z",
  },
  {
    areaId: 1,
    areaName: "Üslü Sayılar",
    scorePercent: 55,
    source: "quiz",
    completedAt: "2026-06-23T10:00:00.000Z",
  },
  {
    areaId: 2,
    areaName: "Geometri",
    scorePercent: 85,
    source: "duel",
    completedAt: "2026-06-22T10:00:00.000Z",
  },
];

describe("scoreToWeaknessLevel", () => {
  it("maps average scores to weakness levels", () => {
    expect(scoreToWeaknessLevel(35)).toBe(5);
    expect(scoreToWeaknessLevel(45)).toBe(4);
    expect(scoreToWeaknessLevel(55)).toBe(3);
    expect(scoreToWeaknessLevel(65)).toBe(2);
    expect(scoreToWeaknessLevel(80)).toBe(1);
  });
});

describe("detectWeaknessesFromSessions", () => {
  it("flags only areas below the weakness threshold", () => {
    const weaknesses = detectWeaknessesFromSessions(sessions);
    expect(weaknesses).toHaveLength(1);
    expect(weaknesses[0]?.areaName).toBe("Üslü Sayılar");
    expect(weaknesses[0]?.averageScore).toBe(47.5);
    expect(weaknesses[0]?.weaknessLevel).toBe(4);
    expect(weaknesses[0]?.sampleCount).toBe(2);
  });
});

describe("mergeRecentAssessmentSessions", () => {
  it("returns the most recent combined quiz and duel sessions", () => {
    const merged = mergeRecentAssessmentSessions(
      sessions.filter((session) => session.source === "quiz"),
      sessions.filter((session) => session.source === "duel"),
      2,
    );

    expect(merged).toHaveLength(2);
    expect(merged[0]?.areaName).toBe("Üslü Sayılar");
    expect(merged[1]?.areaName).toBe("Üslü Sayılar");
  });
});
