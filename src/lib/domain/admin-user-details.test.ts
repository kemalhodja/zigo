import { describe, expect, it } from "vitest";

import {
  calculateTrialEligibility,
  isGameCurfewActive,
} from "./admin-user-details";

describe("admin-user-details domain logic", () => {
  it("calculates 7-day trial eligibility correctly within 7 days", () => {
    const today = new Date().toISOString();
    const result = calculateTrialEligibility(today);
    expect(result.isWithin7Days).toBe(true);
    expect(result.discountPercent).toBe(50);
    expect(result.remainingDays).toBeGreaterThanOrEqual(6);
  });

  it("calculates 7-day trial eligibility correctly after 7 days", () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    const result = calculateTrialEligibility(eightDaysAgo);
    expect(result.isWithin7Days).toBe(false);
    expect(result.discountPercent).toBe(0);
    expect(result.remainingDays).toBe(0);
  });

  it("calculates 30-day trial eligibility for teachers correctly", () => {
    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
    const result = calculateTrialEligibility(fifteenDaysAgo, "teacher");
    expect(result.isWithin7Days).toBe(true);
    expect(result.discountPercent).toBe(50);
    expect(result.remainingDays).toBeGreaterThanOrEqual(14);

    const thirtyFiveDaysAgo = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString();
    const expiredResult = calculateTrialEligibility(thirtyFiveDaysAgo, "teacher");
    expect(expiredResult.isWithin7Days).toBe(false);
    expect(expiredResult.discountPercent).toBe(0);
    expect(expiredResult.remainingDays).toBe(0);
  });

  it("calculates curfew status based on Istanbul time (UTC+3)", () => {
    // 23:00 Istanbul time -> 20:00 UTC
    const dateNight = new Date("2026-09-11T20:00:00.000Z");
    expect(isGameCurfewActive(dateNight)).toBe(true);

    // 14:00 Istanbul time -> 11:00 UTC
    const dateDay = new Date("2026-09-11T11:00:00.000Z");
    expect(isGameCurfewActive(dateDay)).toBe(false);

    // 04:00 Istanbul time -> 01:00 UTC
    const dateEarlyMorning = new Date("2026-09-11T01:00:00.000Z");
    expect(isGameCurfewActive(dateEarlyMorning)).toBe(true);
  });
});
