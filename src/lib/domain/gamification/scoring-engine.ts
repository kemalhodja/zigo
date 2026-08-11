/**
 * Zigo - Centralized Scoring Engine (Rule Engine)
 * Defines point values, gems, and level calculations in one single source of truth.
 * This prevents fragmented gamification logic across different components.
 */

export type GamificationAction = 
  | "micro_video_watched" 
  | "mini_quiz_completed" 
  | "duel_won"
  | "post_liked"
  | "streak_maintained"
  | "pomodoro_session_completed";

/**
 * Single source of truth for point values assigned to user actions.
 * Any update to the economy should happen here.
 */
export const ACTION_POINTS: Record<GamificationAction, number> = {
  micro_video_watched: 10,
  mini_quiz_completed: 50,
  duel_won: 100,
  post_liked: 1,
  streak_maintained: 25,
  pomodoro_session_completed: 30,
};

export const LEAGUE_PATH = [
  { label: "Starter", min: 0 },
  { label: "Mint", min: 100 },
  { label: "Crystal", min: 250 },
  { label: "Legend", min: 500 },
] as const;

export const COMPACT_LEAGUES = [
  { label: "Bronze", min: 0, tone: "text-orange-700 bg-orange-50" },
  { label: "Silver", min: 100, tone: "text-slate-600 bg-slate-100" },
  { label: "Gold", min: 200, tone: "text-amber-600 bg-amber-50" },
] as const;

export type StudentGamificationSnapshot = {
  points: number;
  level: number;
  leagueLabel: string;
  nextLeagueLabel: string | null;
  pointsToNextLeague: number;
  levelProgress: number;
  pointsToNextLevel: number;
  gems: number;
};

export class GamificationEngine {
  /**
   * Evaluates how many points an action is worth.
   */
  static getPointsForAction(action: GamificationAction, modifier: number = 1): number {
    return Math.round(ACTION_POINTS[action] * modifier);
  }

  /**
   * 1 Gem is earned for every 25 points.
   */
  static calculateGemsFromPoints(points: number): number {
    return Math.max(0, Math.floor(points / 25));
  }

  /**
   * Levels progress every 100 points.
   */
  static calculateLevel(points: number): number {
    return Math.max(1, Math.floor(points / 100) + 1);
  }

  static getLeague(points: number) {
    return LEAGUE_PATH.reduce((current, league) => (points >= league.min ? league : current), LEAGUE_PATH[0]);
  }

  static getNextLeague(points: number) {
    const currentLeague = this.getLeague(points);
    const currentIndex = LEAGUE_PATH.findIndex((league) => league.label === currentLeague.label);
    return LEAGUE_PATH[currentIndex + 1] ?? null;
  }

  /**
   * Generates a complete snapshot of the user's gamification state.
   */
  static buildSnapshot(points: number): StudentGamificationSnapshot {
    const level = this.calculateLevel(points);
    const currentLevelStart = (level - 1) * 100;
    const nextLevelPoints = level * 100;
    const league = this.getLeague(points);
    const nextLeague = this.getNextLeague(points);

    return {
      points,
      level,
      leagueLabel: `${league.label} League`,
      nextLeagueLabel: nextLeague?.label ?? null,
      pointsToNextLeague: nextLeague ? Math.max(0, nextLeague.min - points) : 0,
      levelProgress: Math.min(100, ((points - currentLevelStart) / 100) * 100),
      pointsToNextLevel: Math.max(0, nextLevelPoints - points),
      gems: this.calculateGemsFromPoints(points),
    };
  }
}
