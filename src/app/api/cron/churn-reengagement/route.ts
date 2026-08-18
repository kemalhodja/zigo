import { NextResponse } from "next/server";

import { sendPushToUsers } from "@/lib/server/onesignal";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Vercel Cron Job — her gün 09:30 UTC çalışır.
 * Aboneliğini iptal etmiş (tier free'ye düşmüş) kullanıcılara
 * 3. 7. ve 14. günlerde geri kazanım push bildirimi gönderir.
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
  const results: Record<string, { found: number; pushed: number }> = {
    day3: { found: 0, pushed: 0 },
    day7: { found: 0, pushed: 0 },
    day14: { found: 0, pushed: 0 },
  };

  const CAMPAIGNS: Array<{ daysAgo: number; label: string; title: string; message: string }> = [
    {
      daysAgo: 3,
      label: "day3",
      title: "💙 Seni özledik!",
      message: "Öğrenme serüvenine kaldığın yerden devam etmek için Zigo Plus sana özel bir fırsat sunuyor.",
    },
    {
      daysAgo: 7,
      label: "day7",
      title: "📚 Eğitim yarım kalmasın!",
      message: "Zigo Plus ile hedeflerine ulaşmaya devam et. Hâlâ iyi bir zaman!",
    },
    {
      daysAgo: 14,
      label: "day14",
      title: "🚀 Zigo'da seni bekleyenler var!",
      message: "Yeni içerikler, oyunlar ve dersler seni bekliyor. Geri dön ve keşfetmeye başla!",
    },
  ];

  for (const campaign of CAMPAIGNS) {
    const windowStart = new Date(now);
    windowStart.setDate(windowStart.getDate() - campaign.daysAgo);
    windowStart.setHours(windowStart.getHours() - 1);
    const windowEnd = new Date(now);
    windowEnd.setDate(windowEnd.getDate() - campaign.daysAgo);
    windowEnd.setHours(windowEnd.getHours() + 1);

    // Şu an free tier'da, daha önce stripe_customer_id'si olan (bir kez abone olmuş) kullanıcılar
    const { data: churnedUsers } = await admin
      .from("user_subscriptions")
      .select("user_id")
      .eq("tier", "free")
      .not("stripe_customer_id", "is", null)
      .gte("updated_at", windowStart.toISOString())
      .lte("updated_at", windowEnd.toISOString());

    if (!churnedUsers || churnedUsers.length === 0) continue;

    const userIds = churnedUsers.map((s) => s.user_id);
    results[campaign.label].found = userIds.length;

    await sendPushToUsers(userIds, {
      title: campaign.title,
      message: campaign.message,
      url: "/billing",
      data: { kind: "churn_reengagement", day: String(campaign.daysAgo) },
    });

    results[campaign.label].pushed = userIds.length;
  }

  return NextResponse.json({ ok: true, results });
}
