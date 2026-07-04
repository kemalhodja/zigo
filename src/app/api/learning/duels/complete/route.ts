import { NextResponse } from "next/server";
import { z } from "zod";

import { completeSafeDuelWin } from "@/lib/domain/learning";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (profile.role !== "student") {
      return NextResponse.json({ error: "Only student accounts can earn duel rewards." }, { status: 403 });
    }

    const body = await request.json();
    const data = await completeSafeDuelWin(supabase, {
      duelId: body.duelId,
      score: body.score,
      totalQuestions: body.totalQuestions,
      areaId: body.areaId,
      userId: profile.id,
    });

    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Submit a valid duel result with score and duel id."
      : error instanceof Error
        ? error.message
        : "Duel reward could not be saved.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
