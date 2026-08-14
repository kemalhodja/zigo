import { NextResponse } from "next/server";
import { z } from "zod";

import { respondWithDomainError } from "@/lib/domain/api-errors";
import {
  createPrivateLessonPost,
  getMatchedLessonPostsForTeacher,
  getParentPrivateLessonPosts,
} from "@/lib/domain/private-lessons";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
    }

    if (profile.role === "parent") {
      const posts = await getParentPrivateLessonPosts(supabase, profile.id);
      return NextResponse.json({ data: posts });
    }

    if (profile.role === "teacher") {
      const posts = await getMatchedLessonPostsForTeacher(supabase, profile.id);
      return NextResponse.json({ data: posts });
    }

    return NextResponse.json({ data: [] });
  } catch (error) {
    return respondWithDomainError(error, "Özel ders ilanları yüklenemedi.");
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
    }

    if (profile.role !== "parent") {
      return NextResponse.json(
        { error: "Özel ders ilanı yalnızca veli hesapları tarafından verilebilir." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const post = await createPrivateLessonPost(supabase, profile.id, body);

    return NextResponse.json({ data: post }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Lütfen form alanlarını eksiksiz doldurun." },
        { status: 400 },
      );
    }
    return respondWithDomainError(error, "Özel ders ilanı oluşturulamadı.");
  }
}
