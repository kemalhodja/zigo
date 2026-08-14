import { NextResponse } from "next/server";
import { z } from "zod";

import { respondWithDomainError } from "@/lib/domain/api-errors";
import { createPrivateLessonBid, getBidsForLessonPost } from "@/lib/domain/private-lessons";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
    }

    const bids = await getBidsForLessonPost(supabase, id, profile.id);
    return NextResponse.json({ data: bids });
  } catch (error) {
    return respondWithDomainError(error, "Teklifler yüklenemedi.");
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
    }

    if (profile.role !== "teacher") {
      return NextResponse.json(
        { error: "Yalnızca öğretmenler özel ders teklifi verebilir." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const bid = await createPrivateLessonBid(supabase, profile.id, {
      postId: id,
      pricePerHourTry: Number(body.pricePerHourTry),
      message: body.message,
    });

    return NextResponse.json({ data: bid }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Lütfen teklif formunu eksiksiz doldurun." },
        { status: 400 },
      );
    }
    return respondWithDomainError(error, "Teklif gönderilemedi.");
  }
}
