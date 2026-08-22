import { type NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { untypedFrom } from "@/lib/supabase/untyped-tables";

type LeaderboardRow = {
  high_score: number;
  last_level: number;
  users?: { id: string; full_name: string | null; avatar_url: string | null } | null;
};

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = createAdminClient() || await createClient();
  const gameType = req.nextUrl.searchParams.get("game_type");

  if (!gameType) {
    return NextResponse.json({ error: "game_type parametresi gerekli" }, { status: 400 });
  }

  // En yüksek skordan en düşüğe göre sırala, ilk 20 kişiyi getir.
  const { data, error } = await untypedFrom(supabase, "game_progress")
    .select(`
      high_score,
      last_level,
      users ( id, full_name, avatar_url )
    `)
    .eq("game_type", gameType)
    .order("high_score", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // users tablosundan inner join veya foreign key garantisi için veri temizliği
  const leaderboard = ((data ?? []) as LeaderboardRow[]).map((row) => ({
    user_id: row.users?.id || "anonim",
    full_name: row.users?.full_name || "Gizli Oyuncu",
    avatar_url: row.users?.avatar_url || null,
    high_score: row.high_score,
    last_level: row.last_level,
  }));

  return NextResponse.json(leaderboard);
}
