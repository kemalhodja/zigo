import { NextResponse } from "next/server";
import { z } from "zod";

import { leaveClassGroup } from "@/lib/domain/class-groups";
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
    const success = await leaveClassGroup(supabase, {
      groupId: body.groupId,
      childProfileId: body.childProfileId ?? null,
    });

    return NextResponse.json({ data: { success } });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? error.issues[0]?.message || "Geçersiz istek."
      : error instanceof Error
        ? error.message
        : "Sınıf grubundan ayrılınamadı.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
