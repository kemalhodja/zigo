import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase.rpc("record_store_visit_mission");
    if (error) throw error;

    const [result] = data ?? [];
    return NextResponse.json({ data: result ?? { recorded: false, already_recorded: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Store visit could not be recorded.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
