import { NextResponse } from "next/server";

import { respondWithDomainError } from "@/lib/domain/api-errors";
import { getCurrentProfile } from "@/lib/domain/profiles";
import {
  WEEKLY_LEAGUE_TIERS,
  type WeeklyLeagueParticipant,
  type WeeklyLeagueTier,
} from "@/lib/domain/weekly-leagues";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedTier = searchParams.get("tier") as WeeklyLeagueTier | null;

    // 1. Get user tier if not explicitly specified
    let targetTier: WeeklyLeagueTier = requestedTier || "bronze";
    if (!requestedTier) {
      const { data: userTierData } = await (supabase as any).rpc("get_user_league_tier", {
        p_user_id: profile.id,
      });
      if (userTierData && typeof userTierData === "string") {
        targetTier = userTierData as WeeklyLeagueTier;
      }
    }

    // 2. Fetch league bucket from get_weekly_league_v2
    const { data: rowsData, error } = await (supabase as any).rpc("get_weekly_league_v2", {
      p_tier: targetTier,
      p_limit: 30,
    });

    if (error) {
      return NextResponse.json({ error: "Lig verisi alınamadı." }, { status: 500 });
    }

    const participants = (rowsData ?? []) as WeeklyLeagueParticipant[];
    const viewerRankIndex = participants.findIndex((p) => p.user_id === profile.id);
    const viewerParticipant = viewerRankIndex >= 0 ? participants[viewerRankIndex] : null;

    return NextResponse.json({
      data: {
        tier: targetTier,
        tierConfig: WEEKLY_LEAGUE_TIERS[targetTier] || WEEKLY_LEAGUE_TIERS.bronze,
        participants,
        viewer: viewerParticipant,
        viewerRank: viewerRankIndex >= 0 ? viewerRankIndex + 1 : null,
      },
    });
  } catch (error) {
    return respondWithDomainError(error, "Haftalık lig verisi alınamadı.");
  }
}
