import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, score, game_type, stats } = body;

    console.log(`[Mini Game Finish] Game: ${game_type}, User: ${user_id}, Score: ${score}`, stats);

    if (user_id && user_id !== "guest") {
      try {
        const supabase = await createClient();
        
        // Kullanıcının puanını güncelle (Gamification Puanı: Her 100 skor = 10 XP veya skora göre oranlı)
        const awardedPoints = Math.max(5, Math.floor((score || 0) / 10));
        
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

