import { NextResponse } from "next/server";
import { z } from "zod";

import { updateChildAvatarAssets } from "@/lib/domain/children";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (profile.role !== "parent") {
      return NextResponse.json({ error: "Only parents can manage child avatar rewards." }, { status: 403 });
    }

    const body = await request.json();
    const result = await updateChildAvatarAssets(supabase, {
      childProfileId: body.childProfileId,
      assets: body.assets,
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Choose a valid child profile and avatar assets."
      : error instanceof Error
        ? error.message
        : "Child avatar could not be updated.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
