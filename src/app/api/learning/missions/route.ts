import { NextResponse } from "next/server";

import { getDailyMissionProgress } from "@/lib/domain/learning";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (profile.role !== "student") {
      return NextResponse.json({
        data: {
          completedIds: [],
          streakDays: 0,
          eventsToday: 0,
        },
      });
    }

    const data = await getDailyMissionProgress(supabase, profile.id);
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Daily missions could not be loaded.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
