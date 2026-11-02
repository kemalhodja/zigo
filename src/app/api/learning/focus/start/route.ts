import { assertSafeStudentTextAsync } from "@/lib/domain/moderation";
import { asUntyped } from "@/lib/supabase/helpers";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const areaId = typeof body?.areaId === "number" ? body.areaId : null;
    const rawTopic = typeof body?.topicLabel === "string" ? body.topicLabel.trim() : "";
    const topicLabel = rawTopic.length >= 2 ? rawTopic.slice(0, 120) : "Odaklanma Seansı";
    const targetSeconds =
      typeof body?.targetSeconds === "number" && body.targetSeconds >= 60
        ? Math.min(3600, Math.round(body.targetSeconds))
        : 1500;

    try {
      await assertSafeStudentTextAsync(topicLabel);
    } catch {
      return Response.json({ error: "Lütfen uygun bir çalışma konusu girin." }, { status: 400 });
    }

    const { data, error } = await asUntyped(supabase).rpc("start_focus_session", {
      p_area_id: areaId,
      p_topic_label: topicLabel,
      p_target_seconds: targetSeconds,
    });

    if (error) {
      console.warn("start_focus_session RPC fallback:", error.message);
      // Fallback session so user's timer still starts smoothly
      return Response.json({
        id: `local-${Date.now()}`,
        user_id: user.id,
        area_id: areaId,
        topic_label: topicLabel,
        target_seconds: targetSeconds,
        started_at: new Date().toISOString(),
        completed_at: null,
        status: "in_progress",
        points_awarded: 0,
      });
    }

    return Response.json(data);
  } catch (err) {
    console.warn("POST /api/learning/focus/start error:", err);
    return Response.json({ error: "Odaklanma oturumu başlatılamadı." }, { status: 500 });
  }
}
