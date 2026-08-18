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

        // 🔒 Güvenlik: Hile (manipülasyon) koruması için XP'yi tavan değere sabitle (Max 100 XP)
        const calculatedPoints = Math.max(5, Math.floor((score || 0) / 10));
        const awardedPoints = Math.min(100, calculatedPoints);
        
        // Puanı kullanıcının total_points alanına ekle
        const { data: user } = await supabase
          .from("users")
          .select("total_points")
          .eq("id", user_id)
          .single();
        
        if (user) {
          await supabase
            .from("users")
            .update({ total_points: (user.total_points || 0) + awardedPoints })
            .eq("id", user_id);
        }

        // 🕹️ Günlük oyun süresi takibi (oturum sonu — useGameSessionTimer ana kaynak)
        if (played_seconds && typeof played_seconds === "number" && played_seconds > 0) {
          const safeSeconds = Math.min(Math.floor(played_seconds), 7200);
          const todayTR = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().split("T")[0];
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
      } catch (dbErr) {
        console.warn("[Mini Game Finish] Veritabanı puan güncelleme atlandı:", dbErr);
      }
    }

    return NextResponse.json(
      { success: true, message: "Skor başarıyla kaydedildi.", score },
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

