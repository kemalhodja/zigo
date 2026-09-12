import { NextResponse } from "next/server";

import { respondWithDomainError } from "@/lib/domain/api-errors";
import { type RoomCompetitor } from "@/lib/domain/focus-rooms";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { asUntyped } from "@/lib/supabase/helpers";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    if (!slug) {
      return NextResponse.json({ error: "Oda kodu gerekli." }, { status: 400 });
    }

    const { data, error } = await asUntyped(supabase).rpc("get_room_leaderboard", {
      p_slug: slug,
      p_limit: 10,
    });

    if (error) {
      return NextResponse.json({ error: "Liderlik tablosu alınamadı." }, { status: 500 });
    }

    const competitors = (data ?? []) as RoomCompetitor[];
    return NextResponse.json({ data: { competitors } });
  } catch (error) {
    return respondWithDomainError(error, "Oda liderlik tablosu alınamadı.");
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { slug, blockIndex } = body as { slug?: string; blockIndex?: number };

    if (!slug || typeof blockIndex !== "number") {
      return NextResponse.json({ error: "Geçersiz parametreler." }, { status: 400 });
    }

    const { data, error } = await asUntyped(supabase).rpc("complete_focus_block", {
      p_user_id: profile.id,
      p_room_slug: slug,
      p_block_index: blockIndex,
    });

    if (error) {
      return NextResponse.json({ error: "Blok kaydedilemedi." }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return respondWithDomainError(error, "Odak bloğu kaydedilemedi.");
  }
}
