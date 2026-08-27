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

  if (!sessionId || typeof sessionId !== "string") {
    return Response.json({ error: "sessionId is required" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("complete_focus_session", {
    p_session_id: sessionId,
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json(data?.[0] ?? null);
}