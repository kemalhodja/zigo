import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { getSocialFeed } from "@/lib/domain/social";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = new URL(request.url).searchParams;
    const rawLimit = Number(searchParams.get("limit") ?? 30);
    const rawOffset = Number(searchParams.get("offset") ?? 0);
    const cursor = searchParams.get("cursor");
    const limit = Number.isFinite(rawLimit) ? Math.min(50, Math.max(1, rawLimit)) : 30;
    const offset = Number.isFinite(rawOffset) ? Math.max(0, rawOffset) : 0;
    const page = await getSocialFeed(supabase, profile.id, {
      limit,
      cursor: cursor ?? undefined,
      offset: cursor ? undefined : offset,
    });
    return NextResponse.json({
      data: page.posts,
      meta: {
        count: page.posts.length,
        hasMore: Boolean(page.nextCursor),
        limit,
        offset: cursor ? undefined : offset,
        nextCursor: page.nextCursor,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Feed could not be loaded.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
