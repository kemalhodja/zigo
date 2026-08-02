export type AreaLeaderboardEntry = {
  userId: string;
  fullName: string;
  totalPoints: number;
  rank: number;
};

export function normalizeLeaderboardRows(
  rows: Array<{
    user_id: string;
    full_name: string;
    total_points: number;
    rank: number;
  }>,
): AreaLeaderboardEntry[] {
  return rows.map((row) => ({
    userId: row.user_id,
    fullName: row.full_name,
    totalPoints: row.total_points,
    rank: row.rank,
  }));
}

export function findViewerRank(entries: AreaLeaderboardEntry[], viewerId: string | null | undefined) {
  if (!viewerId) return null;
  return entries.find((entry) => entry.userId === viewerId) ?? null;
}
