import { describe, expect, it } from "vitest";

import { findViewerRank, normalizeLeaderboardRows } from "@/lib/domain/student-leaderboard";

describe("student-leaderboard", () => {
  it("normalizes RPC rows", () => {
    const entries = normalizeLeaderboardRows([
      { user_id: "a", full_name: "Ada", total_points: 120, rank: 1 },
    ]);
    expect(entries[0]).toEqual({
      userId: "a",
      fullName: "Ada",
      totalPoints: 120,
      rank: 1,
    });
  });

  it("finds viewer rank", () => {
    const entries = normalizeLeaderboardRows([
      { user_id: "a", full_name: "Ada", total_points: 120, rank: 1 },
      { user_id: "b", full_name: "Bora", total_points: 80, rank: 2 },
    ]);
    expect(findViewerRank(entries, "b")?.rank).toBe(2);
    expect(findViewerRank(entries, null)).toBeNull();
  });
});
