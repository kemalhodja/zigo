import { NextResponse } from "next/server";

import { getDailyMissionProgress } from "@/lib/domain/learning";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { getPrimaryInterestAreaId } from "@/lib/domain/student-leaderboard-service";
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
    const areaId = await getPrimaryInterestAreaId(supabase, profile.id);
    
    let areaName = "";
    if (areaId) {
      const { data: areaData } = await supabase.from("education_areas").select("area_name").eq("id", areaId).maybeSingle();
      if (areaData?.area_name) {
        areaName = areaData.area_name;
      }
    }

    const watchTitle = areaName ? `Bugün ${areaName} kısa dersi izle` : "Bugün 1 kısa ders izle";
    const watchHref = areaName ? `/micro?q=${encodeURIComponent(areaName)}` : "/micro";
    
    const quizTitle = areaName ? `Bugün ${areaName} quizi çöz` : "Bugün 1 quiz çöz";
    const quizHref = areaName ? `/learn?q=${encodeURIComponent(areaName)}` : "/learn";

    const dynamicMissions = [
      {
        id: "watch-reel",
        title: watchTitle,
        reward: "+10 XP",
        href: watchHref,
      },
      {
        id: "solve-quiz",
        title: quizTitle,
        reward: "+10 XP",
        href: quizHref,
      },
      {
        id: "visit-store",
        title: "Ödül mağazasını ziyaret et",
        reward: "Puan Harca",
        href: "/store",
      },
    ];

    return NextResponse.json({ data: { ...data, dynamicMissions } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Daily missions could not be loaded.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
