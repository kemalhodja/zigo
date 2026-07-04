import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { markNotificationsRead } from "@/lib/domain/social";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await markNotificationsRead(supabase, profile.id);
    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Notifications could not be marked as read.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
