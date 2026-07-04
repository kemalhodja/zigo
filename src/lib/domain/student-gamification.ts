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

export function getGemBalance(points: number) {
  return Math.max(0, Math.floor(points / 25));
}

export function getStudentLevel(points: number) {
  return Math.max(1, Math.floor(points / 100) + 1);
}

export function getLeaguePathEntry(points: number) {
  return LEAGUE_PATH.reduce((current, league) => (points >= league.min ? league : current), LEAGUE_PATH[0]);
}

export function getNextLeaguePathEntry(points: number) {
  const currentIndex = LEAGUE_PATH.findIndex((league) => league.label === getLeaguePathEntry(points).label);
  return LEAGUE_PATH[currentIndex + 1] ?? null;
}

export function getCompactLeague(points: number) {
  return COMPACT_LEAGUES.reduce((current, league) => (points >= league.min ? league : current), COMPACT_LEAGUES[0]);
}

export function buildStudentGamification(points: number): StudentGamificationSnapshot {
  const level = getStudentLevel(points);
  const currentLevelStart = (level - 1) * 100;
  const nextLevelPoints = level * 100;
  const league = getLeaguePathEntry(points);
  const nextLeague = getNextLeaguePathEntry(points);

  return {
    points,
    level,
    leagueLabel: `${league.label} League`,
    nextLeagueLabel: nextLeague?.label ?? null,
    pointsToNextLeague: nextLeague ? Math.max(0, nextLeague.min - points) : 0,
    levelProgress: Math.min(100, ((points - currentLevelStart) / 100) * 100),
    pointsToNextLevel: Math.max(0, nextLevelPoints - points),
    gems: getGemBalance(points),
  };
}
