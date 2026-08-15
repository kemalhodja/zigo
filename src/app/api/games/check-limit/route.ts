import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/games/check-limit
 * Öğrencinin oyun oynayıp oynayamayacağını kontrol eder.
 * Kontroller:
 *  1. Gece yasağı (22:00 - 08:00, Türkiye saati)
 *  2. Günlük oyun süresi limiti (varsayılan 60 dk)
 *  3. Veli override ayarları (parent_game_settings tablosu)
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      return NextResponse.json({ allowed: false, reason: "unauthenticated" }, { status: 401 });
    }

    const userId = authData.user.id;
    const admin = createAdminClient() ?? supabase;

    // Sadece öğrencilere kısıtlama uygula, diğer rollere (veli, öğretmen vs.) serbest
    const { data: userData } = await admin
      .from("users")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (userData?.role !== "student") {
      return NextResponse.json({ allowed: true, reason: "not_student" });
    }

    // Türkiye saati (UTC+3)
    const nowUTC = new Date();
    const turkeyHour = (nowUTC.getUTCHours() + 3) % 24;
    const todayTR = new Date(nowUTC.getTime() + 3 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    // --- Veli ayarlarını çek ---
    // Not: Öğrencinin child_profile'ını bulmak için şu an users tablosunda parent_id veya child_profiles'da user_id yok.
    // Bu yüzden bağımsız öğrenciler için varsayılan limitleri (60dk / Gece Yasağı) uyguluyoruz.
    let dailyLimitMinutes = 60;
    let nightBanEnabled = true;
    let nightBanStart = 22;
    let nightBanEnd = 8;

    // --- Gece yasağı kontrolü ---
    if (nightBanEnabled) {
      const isNightBan =
        nightBanStart > nightBanEnd
          ? turkeyHour >= nightBanStart || turkeyHour < nightBanEnd
          : turkeyHour >= nightBanStart && turkeyHour < nightBanEnd;

      if (isNightBan) {
        return NextResponse.json({
          allowed: false,
          reason: "night_ban",
          message: `Oyunlar ${nightBanEnd}:00 - ${nightBanStart}:00 saatleri arasında aktif.`,
          turkeyHour,
        });
      }
    }

    // --- Günlük süre kontrolü ---
    const { data: usage } = await (admin as any)
      .from("game_daily_usage")
      .select("seconds_played")
      .eq("user_id", userId)
      .eq("date", todayTR)
      .maybeSingle();

    const secondsPlayed = usage?.seconds_played ?? 0;
    const limitSeconds = dailyLimitMinutes * 60;
    const remaining = Math.max(0, limitSeconds - secondsPlayed);

    if (secondsPlayed >= limitSeconds) {
      return NextResponse.json({
        allowed: false,
        reason: "daily_limit",
        message: `Günlük ${dailyLimitMinutes} dakikalık oyun süren doldu. Yarın devam edebilirsin! 🌙`,
        secondsPlayed,
        limitSeconds,
        remaining: 0,
      });
    }

    return NextResponse.json({
      allowed: true,
      secondsPlayed,
      limitSeconds,
      remaining,
      remainingMinutes: Math.floor(remaining / 60),
    });
  } catch (error) {
    console.error("[check-limit]", error);
    // Hata durumunda oyuna izin ver (kullanıcı deneyimini kesmemek için)
    return NextResponse.json({ allowed: true, reason: "error_fallback" });
  }
}
