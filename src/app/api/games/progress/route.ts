import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/domain/profiles";

type GameType = "memory_card" | "block_puzzle" | "pipe_connect";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const gameType = req.nextUrl.searchParams.get("game_type") as GameType | null;

  if (gameType) {
    const { data } = await supabase
      .from("game_progress" as any)
      .select("high_score, last_level, total_plays")
      .eq("user_id", profile.id)
      .eq("game_type", gameType)
      .maybeSingle();

    return NextResponse.json(data ?? { high_score: 0, last_level: 0, total_plays: 0 });
  }

  // Return all game progress
  const { data } = await supabase
    .from("game_progress" as any)
    .select("game_type, high_score, last_level, total_plays")
    .eq("user_id", profile.id);

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { game_type: GameType; score: number; level?: number };
  const { game_type, score, level = 0 } = body;

  if (!game_type || score == null) {
    return NextResponse.json({ error: "game_type ve score gerekli" }, { status: 400 });
  }

  // Mevcut en yüksek skoru kontrol et
  const { data: existing } = await supabase
    .from("game_progress" as any)
    .select("high_score, last_level, total_plays")
    .eq("user_id", profile.id)
    .eq("game_type", game_type)
    .maybeSingle();

  const newHighScore = Math.max(score, (existing as any)?.high_score ?? 0);
  const newLastLevel = Math.max(level, (existing as any)?.last_level ?? 0);
  const newTotalPlays = ((existing as any)?.total_plays ?? 0) + 1;

  const { error } = await supabase
    .from("game_progress" as any)
    .upsert(
      {
        user_id: profile.id,
        game_type,
        high_score: newHighScore,
        last_level: newLastLevel,
        total_plays: newTotalPlays,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,game_type" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ high_score: newHighScore, last_level: newLastLevel, total_plays: newTotalPlays });
}
