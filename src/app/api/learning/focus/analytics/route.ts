import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("get_student_focus_analytics");

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json(data?.[0] ?? null);
}