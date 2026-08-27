import { type NextRequest, NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";
import { looseFrom } from "@/lib/supabase/untyped-tables";

type GameType =
  | "memory_card"
  | "block_puzzle"
  | "pipe_connect"
  | "word_hunt"
  | "zihin_avcisi"
  | "math_master"
  | "taboo";

const VALID_GAME_TYPES = new Set<string>([
  "memory_card",
  "block_puzzle",
  "pipe_connect",
  "word_hunt",
  "zihin_avcisi",
  "math_master",
  "taboo",
]);

/** Generous anti-cheat ceilings — legit play never approaches these. */
const MAX_SCORE = 250_000;
const MAX_LEVEL = 500;

function sanitizeScore(raw: unknown): number | null {
  const n = typeof raw === "string" ? Number(raw) : (raw as number);
  if (!Number.isFinite(n)) return null;
  const int = Math.floor(n);
  if (int < 0 || int > MAX_SCORE) return null;
  return int;
}

type GameProgressRecord = {
  high_score: number;
  last_level: number;
  total_plays: number;
};

export async function GET(req: NextRequest) {
  try {
    return await handleGet(req);
  } catch (err) {
    console.error("[games/progress] GET crash:", err instanceof Error ? err.stack : err);
    return NextResponse.json({ error: "progress_get_failed" }, { status: 500 });
  }
}

async function handleGet(req: NextRequest) {
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
  try {
    return await handlePost(req);
  } catch (err) {
    console.error("[games/progress] POST crash:", err instanceof Error ? err.stack : err);
    return NextResponse.json({ error: "progress_post_failed" }, { status: 500 });
  }
}

async function handlePost(req: NextRequest) {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { game_type: GameType; score: number; level?: number };
  const { game_type } = body;

  const score = sanitizeScore(body.score);
  const levelRaw = typeof body.level === "string" ? Number(body.level) : body.level;
  const level = Number.isFinite(levelRaw) ? Math.max(0, Math.min(Math.floor(levelRaw as number), MAX_LEVEL)) : 0;

  if (!game_type || !VALID_GAME_TYPES.has(game_type)) {
    return NextResponse.json({ error: "geçersiz game_type" }, { status: 400 });
  }
  if (score === null) {
    return NextResponse.json({ error: "geçersiz score" }, { status: 400 });
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

  const adminClient = supabase || supabase;

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
