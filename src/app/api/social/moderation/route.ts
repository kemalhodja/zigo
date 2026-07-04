import { NextResponse } from "next/server";

import { isCurrentUserPlatformAdmin } from "@/lib/domain/admin";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { moderateSafetyQueueItem, moderationActionSchema } from "@/lib/domain/social";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isPlatformAdmin = await isCurrentUserPlatformAdmin(supabase);
    if (profile.role !== "teacher" && !isPlatformAdmin) {
      return NextResponse.json({ error: "Only content owners or platform admins can moderate this queue." }, { status: 403 });
    }

    const body = moderationActionSchema.parse(await request.json());
    const data = await moderateSafetyQueueItem(supabase, {
      itemId: body.itemId,
      kind: body.kind,
      moderatorId: profile.id,
      status: body.status,
    });

    return NextResponse.json({ data, meta: { action: "moderate-safety-item" } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Moderation action failed" },
      { status: 400 },
    );
  }
}
