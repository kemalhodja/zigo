import { NextResponse } from "next/server";
import { z } from "zod";

import { requirePlatformAdmin } from "@/lib/domain/admin-auth";

const sendSchema = z.object({
  targetRole: z.enum(["all", "student", "teacher", "parent", "education_institution", "education_platform", "publisher"]),
  targetFilter: z.enum(["all", "subscribed", "trial", "expired"]).default("all"),
  title: z.string().trim().min(2).max(100),
  body: z.string().trim().min(5).max(1000),
  scheduledAt: z.string().nullable().optional(),
  templateKey: z.string().nullable().optional(),
});

export async function GET() {
  try {
    const auth = await requirePlatformAdmin();
    if ("error" in auth) return auth.error;

    const { data, error } = await (auth.supabase as any)
      .from("notification_schedules")
      .select("id, title, body, target_role, status, sent_count, created_at, sent_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Geçmiş yüklenemedi." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requirePlatformAdmin();
    if ("error" in auth) return auth.error;

    const payload = sendSchema.parse(await request.json());
    const isScheduled = !!payload.scheduledAt;

    if (!isScheduled) {
      // Anında gönderim: hedef kullanıcıları bul
      let query = auth.supabase.from("users").select("id");

      if (payload.targetRole !== "all") {
        query = query.eq("role", payload.targetRole as any);
      }

      // Abonelik filtresi
      if (payload.targetFilter === "subscribed") {
        const { data: subUsers } = await (auth.supabase as any)
          .from("user_subscriptions")
          .select("user_id")
          .or("status.eq.active,tier.eq.zigo_plus");
        const subUserIds = (subUsers ?? []).map((s: { user_id: string }) => s.user_id);
        if (subUserIds.length === 0) {
          return NextResponse.json({ error: "Abone kullanıcı bulunamadı." }, { status: 400 });
        }
        query = query.in("id", subUserIds);
      } else if (payload.targetFilter === "trial") {
        const { data: trialUsers } = await (auth.supabase as any)
          .from("user_subscriptions")
          .select("user_id")
          .eq("status", "trialing");
        const trialIds = (trialUsers ?? []).map((s: { user_id: string }) => s.user_id);
        if (trialIds.length === 0) {
          return NextResponse.json({ error: "Deneme kullanan kullanıcı bulunamadı." }, { status: 400 });
        }
        query = query.in("id", trialIds);
      }

      const { data: targetUsers, error: fetchError } = await query;
      if (fetchError || !targetUsers || targetUsers.length === 0) {
        return NextResponse.json({ error: "Hedef kitlede kullanıcı bulunamadı." }, { status: 400 });
      }

      const fullMessage = `📣 ${payload.title}\n${payload.body}`;
      const notifications = targetUsers.map((user) => ({
        user_id: user.id,
        actor_id: auth.profile.id,
        kind: "system" as const,
        message: fullMessage,
      }));

      const { error: insertError } = await auth.supabase.from("notifications").insert(notifications);
      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 400 });
      }

      // Geçmiş kaydı
      await (auth.supabase as any).from("notification_schedules").insert({
        created_by: auth.profile.id,
        title: payload.title,
        body: payload.body,
        target_role: payload.targetRole,
        target_filter: { filter: payload.targetFilter },
        template_key: payload.templateKey ?? null,
        status: "sent",
        sent_at: new Date().toISOString(),
        sent_count: targetUsers.length,
      });

      return NextResponse.json({ data: { sentCount: targetUsers.length } });
    }

    // Zamanlanmış gönderim: kaydet
    const { error: scheduleError } = await (auth.supabase as any).from("notification_schedules").insert({
      created_by: auth.profile.id,
      title: payload.title,
      body: payload.body,
      target_role: payload.targetRole,
      target_filter: { filter: payload.targetFilter },
      template_key: payload.templateKey ?? null,
      status: "pending",
      scheduled_at: payload.scheduledAt,
      sent_count: 0,
    });

    if (scheduleError) {
      return NextResponse.json({ error: scheduleError.message }, { status: 400 });
    }

    return NextResponse.json({ data: { sentCount: 0, scheduled: true } });
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? "Geçerli başlık, mesaj ve hedef kitle seçin."
        : error instanceof Error
          ? error.message
          : "Duyuru gönderilemedi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
