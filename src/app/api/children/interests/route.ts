import { NextResponse } from "next/server";
import { z } from "zod";

import { setChildProfileInterests } from "@/lib/domain/children";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (profile.role !== "parent") {
      return NextResponse.json({ error: "Only parents can manage child interests." }, { status: 403 });
    }

    const body = await request.json();
    await setChildProfileInterests(supabase, {
      childProfileId: body.childProfileId,
      areaIds: body.areaIds,
    });

    return NextResponse.json({ data: true });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Choose a valid child profile and up to 20 education areas."
      : error instanceof Error
        ? error.message
        : "Child interests could not be saved.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
