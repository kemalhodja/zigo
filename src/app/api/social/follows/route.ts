import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentProfile } from "@/lib/domain/profiles";
import {
  acceptFollowRequest,
  followSchema,
  getUserFollowersList,
  getUserFollowingList,
  rejectFollowRequest,
  toggleFollow,
} from "@/lib/domain/social";
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
      return NextResponse.json({ error: "İşlem yapmak için lütfen giriş yapın." }, { status: 401 });
    }

    const rawJson = await request.json();
    const action = (rawJson as { action?: string }).action;

    // Follow Request Accept
    if (action === "accept") {
      const requesterId = (rawJson as { requesterId?: string }).requesterId;
      if (!requesterId) {
        return NextResponse.json({ error: "requesterId gereklidir." }, { status: 400 });
      }
      await acceptFollowRequest(supabase, {
        targetUserId: profile.id,
        requesterId,
      });
      revalidatePath("/notifications");
      return NextResponse.json({ success: true, meta: { action: "accept-follow-request" } });
    }

    // Follow Request Reject
    if (action === "reject") {
      const requesterId = (rawJson as { requesterId?: string }).requesterId;
      if (!requesterId) {
        return NextResponse.json({ error: "requesterId gereklidir." }, { status: 400 });
      }
      await rejectFollowRequest(supabase, {
        targetUserId: profile.id,
        requesterId,
      });
      revalidatePath("/notifications");
      return NextResponse.json({ success: true, meta: { action: "reject-follow-request" } });
    }

    // Standard Toggle Follow (or Request Follow if private)
    const body = followSchema.parse(rawJson);
    const data = await toggleFollow(supabase, {
      followerId: profile.id,
      followingId: body.followingId,
      sourcePostId: body.sourcePostId,
    });

    revalidatePath("/");
    revalidatePath("/feed");

    return NextResponse.json({ data, meta: { action: "toggle-follow" } });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Lütfen geçerli bir profil seçin."
      : error instanceof Error
        ? error.message
        : "İşlem tamamlanamadı. Lütfen tekrar deneyin.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
