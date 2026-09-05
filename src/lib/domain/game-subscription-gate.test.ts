import { describe, expect, it } from "vitest";

import {
  DEFAULT_GAME_LIMITS,
  isNightBanActive,
  settingsFromParentRow,
  turkeyHourAndDate,
} from "@/lib/domain/game-limits";

describe("Game Gate Business Logic (Oyun Salonu Kuralı)", () => {
  it("enforces night ban between 22:00 and 08:00 (active hours are 08:00 - 22:00)", () => {
    // Night ban is active at 22:00, 23:00, 00:00, 04:00, 07:00
    expect(isNightBanActive(22, DEFAULT_GAME_LIMITS)).toBe(true);
    expect(isNightBanActive(23, DEFAULT_GAME_LIMITS)).toBe(true);
    expect(isNightBanActive(0, DEFAULT_GAME_LIMITS)).toBe(true);
    expect(isNightBanActive(4, DEFAULT_GAME_LIMITS)).toBe(true);
    expect(isNightBanActive(7, DEFAULT_GAME_LIMITS)).toBe(true);

    // Night ban is INACTIVE between 08:00 and 21:59
    expect(isNightBanActive(8, DEFAULT_GAME_LIMITS)).toBe(false);
    expect(isNightBanActive(12, DEFAULT_GAME_LIMITS)).toBe(false);
    expect(isNightBanActive(15, DEFAULT_GAME_LIMITS)).toBe(false);
    expect(isNightBanActive(21, DEFAULT_GAME_LIMITS)).toBe(false);
  });

  it("caps daily limit to maximum 120 minutes (2 hours)", () => {
    const limits = settingsFromParentRow({
      daily_limit_minutes: 300, // Parent tries to set 5 hours
    });
    expect(limits.dailyLimitMinutes).toBe(120); // Must be capped at 120
  });

  it("correctly converts UTC to Turkey timezone (UTC+3)", () => {
    // 2026-09-05T19:00:00Z UTC -> 22:00 TR (night ban starts)
    const utcDate = new Date(Date.UTC(2026, 8, 5, 19, 0, 0));
    const { turkeyHour, todayTR } = turkeyHourAndDate(utcDate);
    expect(turkeyHour).toBe(22);
    expect(todayTR).toBe("2026-09-05");
    expect(isNightBanActive(turkeyHour, DEFAULT_GAME_LIMITS)).toBe(true);
  });
});
