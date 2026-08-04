import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { followSchema, getUserFollowersList, getUserFollowingList, toggleFollow } from "@/lib/domain/social";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("targetUserId");
    const type = searchParams.get("type") === "following" ? "following" : "followers";

    if (!targetUserId) {
      return NextResponse.json({ error: "targetUserId gereklidir." }, { status: 400 });
    }

    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    const viewerId = profile?.id ?? null;

    const list =
      type === "following"
        ? await getUserFollowingList(supabase, targetUserId, viewerId)
        : await getUserFollowersList(supabase, targetUserId, viewerId);

    return NextResponse.json({ data: list });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Takipçi listesi yüklenemedi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Takip etmek için lütfen giriş yapın." }, { status: 401 });
    }

    const body = followSchema.parse(await request.json());
    const data = await toggleFollow(supabase, {
      followerId: profile.id,
      followingId: body.followingId,
    });

    return NextResponse.json({ data, meta: { action: "toggle-follow" } });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Lütfen takip etmek için geçerli bir profil seçin."
      : error instanceof Error
        ? error.message
        : "Takip işlemi tamamlanamadı. Lütfen tekrar deneyin.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
