import { NextResponse } from "next/server";
import { z } from "zod";

import { setChildProfileInterests } from "@/lib/domain/children";
import { assertAreaIdsAllowedUnderLaunchFreeze } from "@/lib/domain/launch-scope";
import { getCurrentProfile, getEducationAreas } from "@/lib/domain/profiles";
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
    const areaIds = Array.isArray(body.areaIds) ? body.areaIds.map(Number) : [];
    const childProfileId = typeof body.childProfileId === "string" ? body.childProfileId : "";

    const [{ data: child }, areas] = await Promise.all([
      supabase
        .from("child_profiles")
        .select("id, grade_level")
        .eq("id", childProfileId)
        .eq("parent_id", profile.id)
        .maybeSingle(),
      getEducationAreas(supabase),
    ]);

    if (!child) {
      return NextResponse.json({ error: "Child profile not found." }, { status: 404 });
    }

    assertAreaIdsAllowedUnderLaunchFreeze(areas, areaIds, "learner_demand", child.grade_level);

    await setChildProfileInterests(supabase, {
      childProfileId,
      areaIds: body.areaIds,
    });

    return NextResponse.json({ data: true });
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? "Choose a valid child profile and up to 20 education areas."
        : error instanceof Error
          ? error.message
          : "Child interests could not be saved.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
