import { type NextRequest, NextResponse } from "next/server";

import { createTeacherReviewSchema, getTeacherReviews,getTeacherReviewSummary, submitTeacherReview } from "@/lib/domain/teacher-reviews";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const teacherId = searchParams.get("teacherId");

    if (!teacherId) {
      return NextResponse.json({ error: "teacherId parametresi gereklidir." }, { status: 400 });
    }

    const supabase = await createClient();
    const [summary, reviews] = await Promise.all([
      getTeacherReviewSummary(supabase, teacherId),
      getTeacherReviews(supabase, teacherId),
    ]);

    return NextResponse.json({ data: { summary, reviews } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Yorumlar alınamadı." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = createTeacherReviewSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Geçersiz veri." }, { status: 400 });
    }

    const supabase = await createClient();
    const review = await submitTeacherReview(supabase, parsed.data);

    return NextResponse.json({ data: review });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Yorum kaydedilemedi." },
      { status: 500 }
    );
  }
}
