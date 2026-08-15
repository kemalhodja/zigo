import { NextResponse } from "next/server";

import { isNightBanActive, turkeyHourAndDate } from "@/lib/domain/game-limits";
import { resolveStudentGameLimits } from "@/lib/domain/game-limits-server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/games/check-limit
 * Öğrenci: gece yasağı (22:00–08:00) + günlük 60 dk (veli ayarı ile değişebilir).
 * Diğer roller: sınır yok.
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

    const { data: userData } = await admin
      .from("users")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (userData?.role !== "student") {
      return NextResponse.json({ allowed: true, reason: "not_student" });
    }

    const limits = await resolveStudentGameLimits();
    const { turkeyHour, todayTR } = turkeyHourAndDate();

    if (isNightBanActive(turkeyHour, limits)) {
      return NextResponse.json({
        allowed: false,
        reason: "night_ban",
        message: `Oyunlar ${limits.nightBanEndLabel} - ${limits.nightBanStartLabel} saatleri arasında aktif.`,
        turkeyHour,
        activeHours: `${limits.nightBanEndLabel} – ${limits.nightBanStartLabel}`,
      });
    }

    const { data: usage } = await (admin as unknown as {
      from: (table: string) => {
        select: (cols: string) => {
          eq: (col: string, val: string) => {
            eq: (col2: string, val2: string) => {
              maybeSingle: () => Promise<{ data: { seconds_played?: number } | null }>;
            };
          };
        };
      };
    })
      .from("game_daily_usage")
      .select("seconds_played")
      .eq("user_id", userId)
      .eq("date", todayTR)
      .maybeSingle();

    const secondsPlayed = usage?.seconds_played ?? 0;
    const limitSeconds = limits.dailyLimitMinutes * 60;
    const remaining = Math.max(0, limitSeconds - secondsPlayed);

    if (secondsPlayed >= limitSeconds) {
      return NextResponse.json({
        allowed: false,
        reason: "daily_limit",
        message: `Günlük ${limits.dailyLimitMinutes} dakikalık oyun süren doldu. Yarın devam edebilirsin! 🌙`,
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
      remainingMinutes: Math.ceil(remaining / 60),
      dailyLimitMinutes: limits.dailyLimitMinutes,
      activeHours: `${limits.nightBanEndLabel} – ${limits.nightBanStartLabel}`,
    });
  } catch (error) {
    console.error("[check-limit]", error);
    return NextResponse.json({ allowed: true, reason: "error_fallback" });
  }
}
