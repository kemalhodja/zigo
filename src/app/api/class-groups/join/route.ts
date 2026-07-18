import { NextResponse } from "next/server";
import { z } from "zod";

import { joinClassGroup } from "@/lib/domain/class-groups";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
    }

    const body = await request.json();
    const group = await joinClassGroup(supabase, {
      city: body.city,
      district: body.district,
      schoolName: body.schoolName,
      gradeLevel: body.gradeLevel,
      classroom: body.classroom,
      childProfileId: body.childProfileId ?? null,
    });

    return NextResponse.json({ data: group });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? error.issues[0]?.message || "Geçersiz giriş."
      : error instanceof Error
        ? error.message
        : "Sınıf grubuna katılım sağlanamadı.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
