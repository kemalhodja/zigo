import { NextResponse } from "next/server";

import { getLessonRequestUnreadCount } from "@/lib/domain/lesson-requests";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (profile.role === "student") {
      return NextResponse.json({ count: 0 });
    }

    const count = await getLessonRequestUnreadCount(supabase, profile.id, profile.role);
    return NextResponse.json({ count });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unread count could not be loaded.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
