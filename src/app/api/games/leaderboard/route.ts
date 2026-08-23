import { type NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { looseFrom } from "@/lib/supabase/untyped-tables";

export const dynamic = "force-dynamic";

type ProgressRow = {
  user_id: string;
  high_score: number;
  last_level: number;
};

type UserRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

export async function GET(req: NextRequest) {
  try {
    return await handleLeaderboard(req);
  } catch (err) {
    console.error("[leaderboard] crash:", err instanceof Error ? err.stack : err);
    return NextResponse.json({ error: "leaderboard_failed" }, { status: 500 });
  }
}

async function handleLeaderboard(req: NextRequest) {
  const supabase = createAdminClient() || await createClient();
  const gameType = req.nextUrl.searchParams.get("game_type");

  if (!gameType) {
    return NextResponse.json({ error: "game_type parametresi gerekli" }, { status: 400 });
  }

  // Step 1: Get top 20 scores
  const { data: progressData, error: progressError } = await looseFrom(supabase, "game_progress")
    .select("user_id, high_score, last_level")
    .eq("game_type", gameType)
    .order("high_score", { ascending: false })
    .limit(20);

  if (progressError) {
    return NextResponse.json({ error: (progressError as { message?: string }).message ?? "DB error" }, { status: 500 });
  }

  const rows = (progressData ?? []) as ProgressRow[];
  if (rows.length === 0) return NextResponse.json([]);

  // Step 2: Fetch user profiles in a single query
  const userIds = rows.map((r) => r.user_id);
  const { data: usersData } = await looseFrom(supabase, "users")
    .select("id, full_name, avatar_url")
    .in("id", userIds);

  const usersMap = new Map<string, UserRow>(
    ((usersData ?? []) as UserRow[]).map((u) => [u.id, u])
  );

  const leaderboard = rows.map((row) => {
    const user = usersMap.get(row.user_id);
    return {
      user_id: row.user_id,
      full_name: user?.full_name ?? "Gizli Oyuncu",
      avatar_url: user?.avatar_url ?? null,
      high_score: row.high_score,
      last_level: row.last_level,
    };
  });

  return NextResponse.json(leaderboard);
}
