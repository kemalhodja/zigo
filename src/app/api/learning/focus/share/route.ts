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
  const sessionId = body?.sessionId;
  const caption = body?.caption ?? null;

  if (!sessionId || typeof sessionId !== "string") {
    return Response.json({ error: "sessionId is required" }, { status: 400 });
  }

  if (caption && typeof caption === "string") {
    await assertSafeStudentTextAsync(caption);
  }

  const { data, error } = await supabase.rpc("share_study_moment", {
    p_session_id: sessionId,
    p_caption: caption,
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json(data);
}