import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, score, game_type, stats, played_seconds } = body;

    console.log(`[Mini Game Finish] Game: ${game_type}, User: ${user_id}, Score: ${score}`, stats);

    if (user_id && user_id !== "guest") {
      try {
        const supabase = await createClient();

        // 🔒 Güvenlik: İsteği gönderen kişinin gerçekten user_id ile aynı kişi olup olmadığını kontrol et
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData.user || authData.user.id !== user_id) {
          return NextResponse.json(
            { success: false, message: "Yetkisiz işlem. Oturum geçersiz." },
            { status: 401 }
          );
        }

        // 🔒 Anti-farm: skor sanitizasyonu — NaN/negatif/aşırı değerler 0'a iner.
        const rawScore = typeof score === "number" ? score : Number(score);
        const safeScore = Number.isFinite(rawScore) && rawScore > 0 ? Math.min(Math.floor(rawScore), 250_000) : 0;

        const calculatedPoints = Math.floor(safeScore / 10);
        const requestedPoints = Math.min(100, calculatedPoints);

        const admin = (await import("@/lib/supabase/admin")).createAdminClient();
        const dbClient = admin ?? supabase;

        // 🔒 Anti-farm: günlük XP tavanı + bitişler arası cooldown.
        const DAILY_XP_CAP = 300;
        const FINISH_COOLDOWN_MS = 15_000;
        const todayTR = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().split("T")[0];

        const { data: user } = await dbClient
          .from("users")
          .select("total_points, game_xp_day, game_xp_today, last_game_xp_at")
          .eq("id", user_id)
          .single();

        let awardedPoints = 0;
        if (user) {
          const xpToday = user.game_xp_day === todayTR ? (user.game_xp_today ?? 0) : 0;
          const lastAt = user.last_game_xp_at ? new Date(user.last_game_xp_at).getTime() : 0;
          const cooling = Date.now() - lastAt < FINISH_COOLDOWN_MS;

          if (!cooling && xpToday < DAILY_XP_CAP) {
            awardedPoints = Math.max(0, Math.min(requestedPoints, DAILY_XP_CAP - xpToday));
          }

          if (awardedPoints > 0 || !cooling) {
            await dbClient
              .from("users")
              .update({
                total_points: (user.total_points || 0) + awardedPoints,
                game_xp_day: todayTR,
                game_xp_today: xpToday + awardedPoints,
                last_game_xp_at: new Date().toISOString(),
              })
              .eq("id", user_id);
          }
        }

        if (awardedPoints === 0 && requestedPoints > 0) {
          console.log(`[Mini Game Finish] XP throttled for ${user_id} (cap/cooldown)`);
        }

        // 🕹️ Günlük oyun süresi takibi (oturum sonu — useGameSessionTimer ana kaynak)
        if (played_seconds && typeof played_seconds === "number" && played_seconds > 0) {
          const safeSeconds = Math.min(Math.floor(played_seconds), 7200);
          const admin = (await import("@/lib/supabase/admin")).createAdminClient();
          const dbClient = admin ?? supabase;

          await (dbClient as unknown as {
            rpc: (
              fn: string,
              args: Record<string, string | number>,
            ) => Promise<{ error: unknown }>;
          }).rpc("increment_game_seconds", {
            p_user_id: user_id,
            p_date: todayTR,
            p_seconds: safeSeconds,
          });
        }

        return NextResponse.json(
          { success: true, message: "Skor kaydedildi.", score: safeScore, xp_awarded: awardedPoints },
          { status: 200 }
        );
      } catch (dbErr) {
        console.warn("[Mini Game Finish] Veritabanı puan güncelleme atlandı:", dbErr);
      }
    }

    return NextResponse.json(
      { success: true, message: "Skor başarıyla kaydedildi.", score: typeof score === "number" ? score : 0 },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Mini Game Finish] API Hatası:", error);
    return NextResponse.json(
      { success: false, message: "Skor kaydedilirken bir hata oluştu." },
      { status: 400 }
    );
  }
}

