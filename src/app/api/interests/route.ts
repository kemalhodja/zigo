import { NextResponse } from "next/server";
import { z } from "zod";

import { isGeneralInterestArea } from "@/lib/domain/general-interest-areas";
import { assertAreaIdsAllowedUnderLaunchFreeze } from "@/lib/domain/launch-scope";
import { getCurrentProfile, getEducationAreas, setUserInterests } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const areaIds = Array.isArray(body.areaIds) ? body.areaIds.map(Number) : [];
    const areas = await getEducationAreas(supabase);

    if (profile.role === "teacher") {
      const selectedAreaObjects = areas.filter((a) => areaIds.includes(a.id));
      const hasAcademicArea = selectedAreaObjects.some((a) => !isGeneralInterestArea(a));
      if (hasAcademicArea) {
        return NextResponse.json(
          { error: "Teachers cannot assign academic teaching areas directly. Only general interest areas allowed." },
          { status: 403 },
        );
      }
    }



    assertAreaIdsAllowedUnderLaunchFreeze(
      areas,
      areaIds,
      "learner_demand",
      profile.grade_level,
    );

    await setUserInterests(supabase, {
      areaIds: body.areaIds,
      organizationType: body.organizationType,
    });

    return NextResponse.json({ data: true });
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? "Choose between 1 and 20 valid education areas."
        : error instanceof Error
          ? error.message
          : "Interests could not be saved.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
