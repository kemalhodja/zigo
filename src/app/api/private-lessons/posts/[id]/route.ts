import { NextResponse } from "next/server";

import { respondWithDomainError } from "@/lib/domain/api-errors";
import {
  closePrivateLessonPost,
  deletePrivateLessonPost,
} from "@/lib/domain/private-lessons";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
    }

    if (profile.role !== "parent") {
      return NextResponse.json(
        { error: "Yalnızca veliler ilan durumunu güncelleyebilir." },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    if (body.action === "close" || body.status === "closed") {
      await closePrivateLessonPost(supabase, profile.id, id);
      return NextResponse.json({ success: true, message: "İlan başarıyla kapatıldı." });
    }

    return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
  } catch (error) {
    return respondWithDomainError(error, "İlan güncellenemedi.");
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
    }

    if (profile.role !== "parent") {
      return NextResponse.json(
        { error: "Yalnızca veliler ilan silebilir." },
        { status: 403 },
      );
    }

    await deletePrivateLessonPost(supabase, profile.id, id);
    return NextResponse.json({ success: true, message: "İlan başarıyla silindi." });
  } catch (error) {
    return respondWithDomainError(error, "İlan silinemedi.");
  }
}
