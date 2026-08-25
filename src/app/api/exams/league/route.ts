import { NextResponse } from "next/server";

import { respondWithDomainError } from "@/lib/domain/api-errors";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase.rpc("get_weekly_league", { p_limit: 20 });
    if (error) {
      return NextResponse.json({ error: "Lig verisi alınamadı." }, { status: 500 });
    }

    const rows = (data ?? []) as {
      user_id: string;
      full_name: string | null;
      avatar_url: string | null;
      weekly_points: number;
    }[];

    const viewerIndex = rows.findIndex((row) => row.user_id === profile.id);

    return NextResponse.json({
      data: {
        league: rows.map((row, i) => ({ ...row, rank: i + 1 })),
        viewerRank: viewerIndex >= 0 ? viewerIndex + 1 : null,
      },
    });
  } catch (error) {
    return respondWithDomainError(error, "Lig verisi alınamadı.");
  }
}
