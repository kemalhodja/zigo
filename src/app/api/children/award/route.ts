import { NextResponse } from "next/server";
import { z } from "zod";

import { awardChildLearningPoints } from "@/lib/domain/children";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (profile.role !== "parent") {
      return NextResponse.json({ error: "Only parents can award child profile progress." }, { status: 403 });
    }

    const body = await request.json();
    const result = await awardChildLearningPoints(supabase, {
      childProfileId: body.childProfileId,
      kind: body.kind,
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Choose a valid child profile and learning action."
      : error instanceof Error
        ? error.message
        : "Child points could not be awarded.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
