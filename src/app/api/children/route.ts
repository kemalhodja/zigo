import { NextResponse } from "next/server";
import { z } from "zod";

import { createChildProfile, getChildProfiles } from "@/lib/domain/children";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (profile.role !== "parent") {
      return NextResponse.json({ error: "Only parents can manage child profiles." }, { status: 403 });
    }

    const children = await getChildProfiles(supabase);
    return NextResponse.json({ data: children });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Child profiles could not be loaded.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (profile.role !== "parent") {
      return NextResponse.json({ error: "Only parents can create child profiles." }, { status: 403 });
    }

    const body = await request.json();
    const child = await createChildProfile(supabase, {
      displayName: body.displayName,
      ageGroup: body.ageGroup,
    });

    return NextResponse.json({ data: child }, { status: 201 });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Enter a child name between 2 and 100 characters and an optional age group."
      : error instanceof Error
        ? error.message
        : "Child profile could not be created.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
