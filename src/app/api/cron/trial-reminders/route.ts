import { NextResponse } from "next/server";

import { sendPushToUsers } from "@/lib/server/onesignal";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Vercel Cron Job — her gün 09:00 UTC (12:00 Türkiye) çalışır.
 * Kayıt tarihinden 5 ve 7 gün geçmiş, free tier kullanıcılara
 * trial hatırlatma push bildirimi + in-app bildirim gönderir.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Admin client unavailable" }, { status: 503 });
  }

  const now = new Date();
  const results = { day5: { found: 0, pushed: 0 }, day7: { found: 0, pushed: 0 } };

  async function processDay(daysAgo: number, label: "day5" | "day7") {
    const windowStart = new Date(now);
    windowStart.setDate(windowStart.getDate() - daysAgo);
    windowStart.setHours(windowStart.getHours() - 1);
    const windowEnd = new Date(now);
    windowEnd.setDate(windowEnd.getDate() - daysAgo);
    windowEnd.setHours(windowEnd.getHours() + 1);

    const { data: usersInWindow } = await admin!
      .from("users")
      .select("id, is_premium")
      .gte("created_at", windowStart.toISOString())
      .lte("created_at", windowEnd.toISOString());

    if (!usersInWindow || usersInWindow.length === 0) return;

    const alreadyPremiumUserIds = new Set(
      usersInWindow.filter((u) => u.is_premium === true).map((u) => u.id),
    );
    const windowIds = usersInWindow.map((u) => u.id).filter((id) => !alreadyPremiumUserIds.has(id));
    if (windowIds.length === 0) return;

    const { data: premiumCheck } = await (admin!
      .from("user_subscriptions") as unknown as {
      select: (cols: string) => {
        in: (col: string, vals: string[]) => Promise<{
          data: Array<{ user_id: string; tier?: string; status?: string }> | null;
        }>;
      };
    })
      .select("user_id, tier, status")
      .in("user_id", windowIds);

    const premiumIds = new Set(
      (premiumCheck ?? [])
        .filter((s) => s.tier === "zigo_plus" || s.status === "active")
        .map((s) => s.user_id),
    );
    const freeIds = windowIds.filter((id) => !premiumIds.has(id));

    results[label].found = freeIds.length;
    if (freeIds.length === 0) return;

    const is5 = daysAgo === 5;
    const pushPayload = is5
      ? {
          title: "⏳ Deneme sürenin bitmesine 2 gün kaldı!",
          message: "Zigo Plus ile öğrenmeye kesintisiz devam et. Hemen abone ol!",
          url: "/billing",
          data: { kind: "trial_reminder", day: "5" },
        }
      : {
          title: "🎓 7 günlük deneme süren sona erdi",
          message: "Öğrenme yolculuğun burada bitmesin! Zigo Plus ile devam et.",
          url: "/billing",
          data: { kind: "trial_expired", day: "7" },
        };

    const inAppMessage = is5
      ? "⏳ Deneme sürenin bitmesine 2 gün kaldı! Zigo Plus'a geç ve öğrenmeye kesintisiz devam et."
      : "🎓 7 günlük deneme süren sona erdi. Öğrenmeye devam etmek için Zigo Plus'a abone ol!";

    await sendPushToUsers(freeIds, pushPayload);

    const notifications = freeIds.map((userId) => ({
      user_id: userId,
      actor_id: userId,
      kind: "system" as const,
      message: inAppMessage,
    }));
    await admin!.from("notifications").insert(notifications);

    results[label].pushed = freeIds.length;
  }

  await processDay(5, "day5");
  await processDay(7, "day7");

  return NextResponse.json({ ok: true, results });
}
