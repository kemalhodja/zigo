import type { SupabaseClient } from "@supabase/supabase-js";

export type GameType =
  | "memory_card"
  | "block_puzzle"
  | "pipe_connect"
  | "word_hunt"
  | "word_hunt_daily"
  | "math_master"
  | "taboo"
  | "game_2048"
  | "sudoku";

export const GAME_LABELS: Record<GameType, string> = {
  memory_card: "Hafıza Kartı",
  block_puzzle: "Blok Bulmaca",
  pipe_connect: "Boru Bağlantı",
  word_hunt: "Kelime Avı",
  word_hunt_daily: "Günlük Kelime",
  math_master: "Matematik Ustası",
  taboo: "Tabu",
  game_2048: "2048",
  sudoku: "Sudoku",
};

// ─── Aktif Oturumlar ──────────────────────────────────────────────────────────

export type ActiveGameSession = {
  userId: string;
  userFullName: string;
  userEmail: string;
  gameType: string;
  sessionSeconds: number;
  totalTodaySeconds: number;
  lastActiveAt: string;
  isNightCurfewViolation: boolean;
  isOverDailyLimit: boolean;
  xpEarnedToday: number;
};

export async function getActiveGameSessions(
  supabase: SupabaseClient,
): Promise<ActiveGameSession[]> {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("game_progress")
    .select(`
      user_id,
      game_type,
      session_seconds,
      total_seconds_today,
      last_active_at,
      users!inner(full_name, email)
    `)
    .gte("last_active_at", fiveMinutesAgo)
    .order("last_active_at", { ascending: false })
    .limit(100);

  if (error || !data) return [];

  const now = new Date();
  const hour = now.getHours();
  const isNightWindow = hour >= 22 || hour < 8;

  return data.map((row) => {
    const user = Array.isArray(row.users) ? row.users[0] : row.users;
    const totalToday = row.total_seconds_today ?? 0;

    return {
      userId: row.user_id,
      userFullName: (user as { full_name?: string })?.full_name ?? "—",
      userEmail: (user as { email?: string })?.email ?? "—",
      gameType: row.game_type,
      sessionSeconds: row.session_seconds ?? 0,
      totalTodaySeconds: totalToday,
      lastActiveAt: row.last_active_at,
      isNightCurfewViolation: isNightWindow,
      isOverDailyLimit: totalToday >= 7200, // 120 dk = 7200 sn
      xpEarnedToday: 0,
    };
  });
}

// ─── Gece Yasağı İhlalleri ────────────────────────────────────────────────────

export type NightCurfewViolation = {
  userId: string;
  userFullName: string;
  gameType: string;
  violationAt: string;
  durationSeconds: number;
};

export async function getNightCurfewViolations(
  supabase: SupabaseClient,
  sinceDays = 1,
): Promise<NightCurfewViolation[]> {
  const since = new Date(Date.now() - sinceDays * 86400000).toISOString();

  const { data, error } = await supabase
    .from("game_time_limits")
    .select(`
      user_id,
      game_type,
      played_at,
      duration_seconds,
      users!inner(full_name)
    `)
    .gte("played_at", since)
    .order("played_at", { ascending: false })
    .limit(200);

  if (error || !data) return [];

  return data
    .filter((row) => {
      const hour = new Date(row.played_at).getHours();
      return hour >= 22 || hour < 8;
    })
    .map((row) => {
      const user = Array.isArray(row.users) ? row.users[0] : row.users;
      return {
        userId: row.user_id,
        userFullName: (user as { full_name?: string })?.full_name ?? "—",
        gameType: row.game_type,
        violationAt: row.played_at,
        durationSeconds: row.duration_seconds ?? 0,
      };
    });
}

// ─── Günlük Limit Yaklaşanlar / Aşanlar ──────────────────────────────────────

export type TimeLimitAlert = {
  userId: string;
  userFullName: string;
  totalTodaySeconds: number;
  percentUsed: number;
  isOver: boolean;
};

export async function getDailyLimitAlerts(
  supabase: SupabaseClient,
  thresholdPct = 80,
): Promise<TimeLimitAlert[]> {
  const DAILY_MAX_SECONDS = 7200; // 120 dk

  const { data, error } = await supabase
    .from("game_progress")
    .select(`
      user_id,
      total_seconds_today,
      users!inner(full_name)
    `)
    .gte("total_seconds_today", Math.floor(DAILY_MAX_SECONDS * (thresholdPct / 100)))
    .order("total_seconds_today", { ascending: false })
    .limit(100);

  if (error || !data) return [];

  return data.map((row) => {
    const user = Array.isArray(row.users) ? row.users[0] : row.users;
    const total = row.total_seconds_today ?? 0;
    return {
      userId: row.user_id,
      userFullName: (user as { full_name?: string })?.full_name ?? "—",
      totalTodaySeconds: total,
      percentUsed: Math.round((total / DAILY_MAX_SECONDS) * 100),
      isOver: total >= DAILY_MAX_SECONDS,
    };
  });
}

// ─── Oyun Türü Dağılımı ────────────────────────────────────────────────────────

export type GameTypeStats = {
  gameType: string;
  label: string;
  sessionCount: number;
  uniquePlayers: number;
  totalSeconds: number;
  avgSeconds: number;
};

export async function getGameTypeStats(
  supabase: SupabaseClient,
  sinceDays = 7,
): Promise<GameTypeStats[]> {
  const since = new Date(Date.now() - sinceDays * 86400000).toISOString();

  const { data, error } = await supabase
    .from("game_time_limits")
    .select("user_id, game_type, duration_seconds")
    .gte("played_at", since);

  if (error || !data) return [];

  const byType: Record<string, { sessions: number; players: Set<string>; total: number }> = {};

  for (const row of data) {
    if (!byType[row.game_type]) {
      byType[row.game_type] = { sessions: 0, players: new Set(), total: 0 };
    }
    byType[row.game_type].sessions++;
    byType[row.game_type].players.add(row.user_id);
    byType[row.game_type].total += row.duration_seconds ?? 0;
  }

  return Object.entries(byType)
    .map(([gameType, stats]) => ({
      gameType,
      label: GAME_LABELS[gameType as GameType] ?? gameType,
      sessionCount: stats.sessions,
      uniquePlayers: stats.players.size,
      totalSeconds: stats.total,
      avgSeconds: stats.sessions > 0 ? Math.round(stats.total / stats.sessions) : 0,
    }))
    .sort((a, b) => b.sessionCount - a.sessionCount);
}

// ─── XP Farm Tespiti ──────────────────────────────────────────────────────────

export type XpFarmSuspect = {
  userId: string;
  userFullName: string;
  gameType: string;
  sessionCount: number;
  avgSessionSeconds: number;
  totalSeconds: number;
  riskLevel: "medium" | "high";
};

export async function getXpFarmSuspects(
  supabase: SupabaseClient,
): Promise<XpFarmSuspect[]> {
  const since = new Date(Date.now() - 86400000).toISOString(); // Son 24 saat

  const { data, error } = await supabase
    .from("game_time_limits")
    .select(`
      user_id,
      game_type,
      duration_seconds,
      users!inner(full_name)
    `)
    .gte("played_at", since);

  if (error || !data) return [];

  const byUser: Record<string, { name: string; games: Record<string, number[]> }> = {};

  for (const row of data) {
    const user = Array.isArray(row.users) ? row.users[0] : row.users;
    if (!byUser[row.user_id]) {
      byUser[row.user_id] = { name: (user as { full_name?: string })?.full_name ?? "—", games: {} };
    }
    if (!byUser[row.user_id].games[row.game_type]) {
      byUser[row.user_id].games[row.game_type] = [];
    }
    byUser[row.user_id].games[row.game_type].push(row.duration_seconds ?? 0);
  }

  const suspects: XpFarmSuspect[] = [];

  for (const [userId, userData] of Object.entries(byUser)) {
    for (const [gameType, durations] of Object.entries(userData.games)) {
      const sessionCount = durations.length;
      const totalSeconds = durations.reduce((s, d) => s + d, 0);
      const avgSessionSeconds = sessionCount > 0 ? Math.round(totalSeconds / sessionCount) : 0;

      // Kural: 20+ kısa session (< 30 sn ortalamalı) VEYA 50+ session toplam
      if (sessionCount >= 20 && avgSessionSeconds < 30) {
        suspects.push({ userId, userFullName: userData.name, gameType, sessionCount, avgSessionSeconds, totalSeconds, riskLevel: "high" });
      } else if (sessionCount >= 50) {
        suspects.push({ userId, userFullName: userData.name, gameType, sessionCount, avgSessionSeconds, totalSeconds, riskLevel: "medium" });
      }
    }
  }

  return suspects.sort((a, b) => (b.riskLevel === "high" ? 1 : 0) - (a.riskLevel === "high" ? 1 : 0));
}
