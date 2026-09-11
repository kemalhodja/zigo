import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Weekly League Reset Cron.
 * Runs every Sunday at 23:59 UTC (or Monday 00:00 UTC).
 * 1. Syncs remaining points for the current week.
 * 2. Processes promotions (top 5 move up) & relegations (bottom 5 move down).
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: "Service role key missing" }, { status: 500 });
    }

    // 1. Sync points for the week
    const { error: syncError } = await (admin as any).rpc("sync_weekly_league_points");
    if (syncError) {
      console.error("[CRON] sync_weekly_league_points error:", syncError);
    }

    // 2. Process promotions & relegations
    const { error: promoError } = await (admin as any).rpc("process_weekly_promotions_relegations");
    if (promoError) {
      console.error("[CRON] process_weekly_promotions_relegations error:", promoError);
      return NextResponse.json({ error: promoError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Haftalık ligler başarıyla sıfırlandı ve terfiler/küme düşmeler işlendi.",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bilinmeyen hata";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
