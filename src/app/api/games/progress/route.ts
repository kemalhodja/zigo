import { type NextRequest, NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { looseFrom } from "@/lib/supabase/untyped-tables";

type GameType = "memory_card" | "block_puzzle" | "pipe_connect" | "word_hunt" | "math_master";

type GameProgressRecord = {
  high_score: number;
  last_level: number;
  total_plays: number;
};

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const gameType = req.nextUrl.searchParams.get("game_type") as GameType | null;

  if (gameType) {
    const { data } = await looseFrom(supabase, "game_progress")
      .select("high_score, last_level, total_plays")
      .eq("user_id", profile.id)
      .eq("game_type", gameType)
      .maybeSingle();

    const progress = data as Partial<GameProgressRecord> | null;
    return NextResponse.json(
      progress ?? { high_score: 0, last_level: 0, total_plays: 0 },
    );
  }

  // Return all game progress
  const { data } = await looseFrom(supabase, "game_progress")
    .select("game_type, high_score, last_level, total_plays")
    .eq("user_id", profile.id);

  return NextResponse.json((data ?? []) as GameProgressRecord[]);
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
  const { data: existingData } = await looseFrom(supabase, "game_progress")
    .select("high_score, last_level, total_plays")
    .eq("user_id", profile.id)
    .eq("game_type", game_type)
    .maybeSingle();

  const existing = existingData as Partial<GameProgressRecord> | null;

  const newHighScore = Math.max(score, existing?.high_score ?? 0);
  const newLastLevel = Math.max(level, existing?.last_level ?? 0);
  const newTotalPlays = (existing?.total_plays ?? 0) + 1;

  const adminClient = createAdminClient() || supabase;

  let error;
  if (existing) {
    const { error: updateError } = await looseFrom(adminClient, "game_progress")
      .update({
        high_score: newHighScore,
        last_level: newLastLevel,
        total_plays: newTotalPlays,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", profile.id)
      .eq("game_type", game_type);
    error = updateError;
  } else {
    const { error: insertError } = await looseFrom(adminClient, "game_progress")
      .insert({
        user_id: profile.id,
        game_type,
        high_score: newHighScore,
        last_level: newLastLevel,
        total_plays: newTotalPlays,
        updated_at: new Date().toISOString(),
      });
    error = insertError;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ high_score: newHighScore, last_level: newLastLevel, total_plays: newTotalPlays });
}
