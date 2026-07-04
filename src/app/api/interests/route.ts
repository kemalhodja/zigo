import { NextResponse } from "next/server";
import { z } from "zod";

import { isTeacherGeneralInterestSelection } from "@/lib/domain/general-interest-areas";
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

    if (profile.role === "teacher") {
      const areas = await getEducationAreas(supabase);
      const selected = areas.filter((area) => areaIds.includes(area.id));

      if (!isTeacherGeneralInterestSelection(selected)) {
        return NextResponse.json(
          { error: "Öğretmenler kayıtta yalnızca bir Genel İlgi kategorisi seçebilir." },
          { status: 403 },
        );
      }
    }

    await setUserInterests(supabase, {
      areaIds: body.areaIds,
      organizationType: body.organizationType,
    });

    return NextResponse.json({ data: true });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Choose between 1 and 20 valid education areas."
      : error instanceof Error
        ? error.message
        : "Interests could not be saved.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
