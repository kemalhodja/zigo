import { NextResponse } from "next/server";

import { isNightBanActive, turkeyHourAndDate } from "@/lib/domain/game-limits";
import { resolveStudentGameLimits } from "@/lib/domain/game-limits-server";
import { getUserSubscription } from "@/lib/domain/subscription";
import { requireRole } from "@/lib/server/role-guard";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/games/check-limit
 * Abonesiz: Oyun hakkı yok (0 dk).
 * Öğrenci Abone: gece yasağı (22:00–08:00) + günlük maks 120 dk (2 saat).
 * Diğer roller: Zigo Plus abonesi ise sınır yok.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { user } = await requireRole(["student"], { apiContext: true });
    const userId = user.id;

    const subscription = await getUserSubscription(supabase, userId);
    if (!subscription.isPremium) {
      return NextResponse.json({
        allowed: false,
        reason: "subscription_required",
        message: "Oyun Salonuna erişmek için Zigo Plus aboneliği gereklidir.",
      }, { status: 403 });
    }

    const admin = supabase;

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
