import { NextResponse } from "next/server";
import { z } from "zod";

import { setTeacherAreas, setTeacherAreasSchema } from "@/lib/domain/admin";
import { requirePlatformAdmin } from "@/lib/domain/admin-auth";

export async function POST(request: Request) {
  try {
    const auth = await requirePlatformAdmin();
    if ("error" in auth) {
      return auth.error;
    }

    const body = setTeacherAreasSchema.parse(await request.json());
    await setTeacherAreas(auth.supabase, body);
    return NextResponse.json({ data: { saved: true } });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Choose a valid teacher and at least one education area."
      : error instanceof Error
        ? error.message
        : "Teacher areas could not be saved.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
