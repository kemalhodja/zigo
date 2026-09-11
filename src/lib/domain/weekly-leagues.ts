export type WeeklyLeagueTier = "bronze" | "silver" | "gold" | "diamond";

export interface WeeklyLeagueTierConfig {
  tier: WeeklyLeagueTier;
  name: string;
  emoji: string;
  color: string;
  badgeBg: string;
  textColor: string;
  promotionSlots: number;
  relegationSlots: number;
  bucketSize: number;
}

export const WEEKLY_LEAGUE_TIERS: Record<WeeklyLeagueTier, WeeklyLeagueTierConfig> = {
  bronze: {
    tier: "bronze",
    name: "Bronz Ligi",
    emoji: "🥉",
    color: "from-amber-700 to-amber-900",
    badgeBg: "bg-amber-100 border-amber-300 text-amber-900",
    textColor: "text-amber-800",
    promotionSlots: 5,
    relegationSlots: 0, // Bronzdan düşme yok
    bucketSize: 30,
  },
  silver: {
    tier: "silver",
    name: "Gümüş Ligi",
    emoji: "🥈",
    color: "from-slate-400 to-slate-600",
    badgeBg: "bg-slate-100 border-slate-300 text-slate-800",
    textColor: "text-slate-700",
    promotionSlots: 5,
    relegationSlots: 5,
    bucketSize: 30,
  },
  gold: {
    tier: "gold",
    name: "Altın Ligi",
    emoji: "🥇",
    color: "from-amber-400 to-yellow-600",
    badgeBg: "bg-yellow-100 border-yellow-300 text-yellow-900",
    textColor: "text-yellow-800",
    promotionSlots: 5,
    relegationSlots: 5,
    bucketSize: 30,
  },
  diamond: {
    tier: "diamond",
    name: "Elmas Ligi",
    emoji: "💎",
    color: "from-cyan-400 to-blue-600",
    badgeBg: "bg-cyan-100 border-cyan-300 text-cyan-900",
    textColor: "text-cyan-800",
    promotionSlots: 0, // Elmas en üst lig
    relegationSlots: 5,
    bucketSize: 30,
  },
};

export interface WeeklyLeagueParticipant {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  tier: WeeklyLeagueTier;
  weekly_points: number;
  rank: number;
  is_promotion_zone: boolean;
  is_relegation_zone: boolean;
}

/**
 * Returns current week start Monday 00:00:00 UTC as Date.
 */
export function getWeekStart(nowMs: number = Date.now()): Date {
  const d = new Date(nowMs);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); // Pazartesi 00:00 UTC
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff, 0, 0, 0, 0));
  return monday;
}

/**
 * Calculates remaining time until next Sunday 23:59:59 UTC
 */
export function getCountdownToWeeklyReset(nowMs: number = Date.now()): {
  days: number;
  hours: number;
  minutes: number;
  formatted: string;
} {
  const monday = getWeekStart(nowMs);
  const nextSundayEnd = new Date(monday.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
  const diffMs = Math.max(0, nextSundayEnd.getTime() - nowMs);

  const totalMinutes = Math.floor(diffMs / (60 * 1000));
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  const formatted = days > 0
    ? `${days} gün ${hours} saat`
    : `${hours} saat ${minutes} dk`;

  return { days, hours, minutes, formatted };
}
