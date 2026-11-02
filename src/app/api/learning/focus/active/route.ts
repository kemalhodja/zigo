import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json(null);
    }

    const { data, error } = await supabase.rpc("get_active_focus_session");

    if (error || !data) {
      return Response.json(null);
    }

    const session = Array.isArray(data) ? data[0] : data;
    if (!session || !session.id) {
      return Response.json(null);
    }

    return Response.json(session);
  } catch {
    return Response.json(null);
  }
}
