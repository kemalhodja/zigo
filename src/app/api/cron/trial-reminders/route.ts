import { NextResponse } from "next/server";

import { sendPushToUsers } from "@/lib/server/onesignal";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Vercel Cron Job — her gün 09:00 UTC (12:00 Türkiye) çalışır.
 * Kayıt tarihinden 28 ve 30 gün geçmiş, free tier kullanıcılara
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
  const results = { day28: { found: 0, pushed: 0 }, day30: { found: 0, pushed: 0 } };

  async function processDay(daysAgo: number, label: "day28" | "day30") {
    const windowStart = new Date(now);
    windowStart.setDate(windowStart.getDate() - daysAgo);
    windowStart.setHours(windowStart.getHours() - 1);
    const windowEnd = new Date(now);
    windowEnd.setDate(windowEnd.getDate() - daysAgo);
    windowEnd.setHours(windowEnd.getHours() + 1);

    const { data: usersInWindow } = await admin!
      .from("users")
      .select("id")
      .gte("created_at", windowStart.toISOString())
      .lte("created_at", windowEnd.toISOString());

    if (!usersInWindow || usersInWindow.length === 0) return;

    const windowIds = usersInWindow.map((u) => u.id);
    const { data: premiumCheck } = await admin!
      .from("user_subscriptions")
      .select("user_id")
      .in("user_id", windowIds)
      .eq("tier", "zigo_plus");

    const premiumIds = new Set((premiumCheck ?? []).map((s) => s.user_id));
    const freeIds = windowIds.filter((id) => !premiumIds.has(id));

    results[label].found = freeIds.length;
    if (freeIds.length === 0) return;

    const is28 = daysAgo === 28;
    const pushPayload = is28
      ? {
          title: "⏳ Deneme sürenin bitmesine 2 gün kaldı!",
          message: "Zigo Plus ile öğrenmeye kesintisiz devam et. Hemen abone ol!",
          url: "/billing",
          data: { kind: "trial_reminder", day: "28" },
        }
      : {
          title: "🎓 30 günlük deneme süren sona erdi",
          message: "Öğrenme yolculuğun burada bitmesin! Zigo Plus ile devam et.",
          url: "/billing",
          data: { kind: "trial_expired", day: "30" },
        };

    const inAppMessage = is28
      ? "⏳ Deneme sürenin bitmesine 2 gün kaldı! Zigo Plus'a geç ve öğrenmeye kesintisiz devam et."
      : "🎓 30 günlük deneme süren sona erdi. Öğrenmeye devam etmek için Zigo Plus'a abone ol!";

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

  await processDay(28, "day28");
  await processDay(30, "day30");

  return NextResponse.json({ ok: true, results });
}
