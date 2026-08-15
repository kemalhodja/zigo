export type GameLimitSettings = {
  dailyLimitMinutes: number;
  nightBanEnabled: boolean;
  nightBanStartHour: number;
  nightBanEndHour: number;
  nightBanStartLabel: string;
  nightBanEndLabel: string;
};

export const DEFAULT_GAME_LIMITS: GameLimitSettings = {
  dailyLimitMinutes: 60,
  nightBanEnabled: true,
  nightBanStartHour: 22,
  nightBanEndHour: 8,
  nightBanStartLabel: "22:00",
  nightBanEndLabel: "08:00",
};

export function turkeyHourAndDate(now = new Date()) {
  const turkeyHour = (now.getUTCHours() + 3) % 24;
  const todayTR = new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString().split("T")[0];
  return { turkeyHour, todayTR };
}

export function parseHourFromTimeValue(value: string | null | undefined, fallback: number) {
  if (!value) return fallback;
  const match = /^(\d{1,2})/.exec(value.trim());
  if (!match) return fallback;
  const hour = Number(match[1]);
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) return fallback;
  return hour;
}

export function formatHourLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function isNightBanActive(turkeyHour: number, settings: GameLimitSettings) {
  if (!settings.nightBanEnabled) return false;
  const { nightBanStartHour: start, nightBanEndHour: end } = settings;
  if (start > end) {
    return turkeyHour >= start || turkeyHour < end;
  }
  return turkeyHour >= start && turkeyHour < end;
}

export function settingsFromParentRow(row: {
  daily_limit_minutes?: number | null;
  night_ban_enabled?: boolean | null;
  night_ban_start?: string | null;
  night_ban_end?: string | null;
} | null): GameLimitSettings {
  if (!row) return DEFAULT_GAME_LIMITS;

  const nightBanStartHour = parseHourFromTimeValue(row.night_ban_start, DEFAULT_GAME_LIMITS.nightBanStartHour);
  const nightBanEndHour = parseHourFromTimeValue(row.night_ban_end, DEFAULT_GAME_LIMITS.nightBanEndHour);

  return {
    dailyLimitMinutes: row.daily_limit_minutes ?? DEFAULT_GAME_LIMITS.dailyLimitMinutes,
    nightBanEnabled: row.night_ban_enabled ?? DEFAULT_GAME_LIMITS.nightBanEnabled,
    nightBanStartHour,
    nightBanEndHour,
    nightBanStartLabel: formatHourLabel(nightBanStartHour),
    nightBanEndLabel: formatHourLabel(nightBanEndHour),
  };
}
