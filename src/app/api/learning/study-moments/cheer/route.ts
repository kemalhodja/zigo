import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  momentId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = schema.parse(await request.json());
    const { data, error } = await supabase.rpc("cheer_study_moment", { p_moment_id: body.momentId });
    if (error) throw error;

    const [result] = data ?? [];
    return NextResponse.json({ data: { cheerCount: result?.cheer_count ?? 0 } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cheer could not be recorded.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
