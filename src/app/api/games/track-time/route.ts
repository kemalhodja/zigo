import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

function turkeyDateString() {
  return new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().split("T")[0];
}

/**
 * POST /api/games/track-time
 * Atomically increments daily play time for students.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const body = await request.json();
    const playedSeconds = Number(body?.played_seconds);
    if (!Number.isFinite(playedSeconds) || playedSeconds <= 0) {
      return NextResponse.json({ error: "Geçersiz süre" }, { status: 400 });
    }

    const admin = supabase;

    const { data: userData } = await admin
      .from("users")
      .select("role")
      .eq("id", authData.user.id)
      .maybeSingle();

    // Only students are limited; skip DB writes for other roles
    if (userData?.role !== "student") {
      return NextResponse.json({ ok: true, tracked: false, reason: "not_student" });
    }

    const safeSeconds = Math.min(Math.floor(playedSeconds), 900);
    const todayTR = turkeyDateString();

    const { error: rpcError } = await (admin as unknown as {
      rpc: (
        fn: string,
        args: Record<string, string | number>,
      ) => Promise<{ error: { message: string } | null }>;
    }).rpc("increment_game_seconds", {
      p_user_id: authData.user.id,
      p_date: todayTR,
      p_seconds: safeSeconds,
    });

    if (rpcError) {
      console.error("[track-time] rpc failed", rpcError);
      return NextResponse.json({ error: "Süre kaydedilemedi" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, tracked: true, seconds: safeSeconds });
  } catch (error) {
    console.error("[track-time]", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
