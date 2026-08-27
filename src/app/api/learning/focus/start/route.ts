import { assertSafeStudentTextAsync } from "@/lib/domain/moderation";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const areaId = body?.areaId ?? null;
  const topicLabel = body?.topicLabel ?? "Focused study";

  if (topicLabel && typeof topicLabel === "string") {
    await assertSafeStudentTextAsync(topicLabel);
  }

  const { data, error } = await supabase.rpc("start_focus_session", {
    p_area_id: areaId,
    p_topic_label: topicLabel,
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json(data);
}