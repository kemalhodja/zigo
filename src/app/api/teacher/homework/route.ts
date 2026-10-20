import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

const assignHomeworkSchema = z.object({
  quizId: z.string().uuid(),
  classGroupIds: z.array(z.string().uuid()).min(1).max(20),
  dueDate: z.string().datetime().optional(),
  note: z.string().trim().max(300).optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowedRoles = ["teacher", "education_institution", "education_platform"];
    if (!allowedRoles.includes(profile.role as string)) {
      return NextResponse.json({ error: "Yalnızca öğretmenler ödev atayabilir." }, { status: 403 });
    }

    const parsed = assignHomeworkSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Quiz ID ve en az bir sınıf grubu gerekli." }, { status: 400 });
    }

    const { quizId, classGroupIds, dueDate, note } = parsed.data;

    // Verify the quiz belongs to this teacher
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select("id, title")
      .eq("id", quizId)
      .eq("teacher_id", profile.id)
      .single();

    if (quizError || !quiz) {
      return NextResponse.json({ error: "Quiz bulunamadı veya bu quiz size ait değil." }, { status: 404 });
    }

    // Insert homework assignments
    const rows = classGroupIds.map((cgId) => ({
      quiz_id: quizId,
      class_group_id: cgId,
      assigned_by: profile.id,
      due_date: dueDate ?? null,
      note: note ?? null,
    }));

    const { data, error } = await (supabase as any)
      .from("homework_assignments")
      .upsert(rows, { onConflict: "quiz_id,class_group_id" })
      .select("id");

    if (error) {
      console.error("[HOMEWORK_ASSIGN_ERROR]", error);
      return NextResponse.json({ error: "Ödev atanamadı. Lütfen tekrar dene." }, { status: 500 });
    }

    return NextResponse.json({ assigned: data?.length ?? 0, quizTitle: quiz.title }, { status: 201 });
  } catch (error) {
    console.error("[HOMEWORK_API_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get("quizId");

    let query = (supabase as any)
      .from("homework_assignments")
      .select("id, quiz_id, class_group_id, due_date, note, created_at, quizzes(title)")
      .eq("assigned_by", profile.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (quizId) {
      query = query.eq("quiz_id", quizId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: "Ödevler yüklenemedi." }, { status: 500 });
    }

    return NextResponse.json({ assignments: data ?? [] });
  } catch (error) {
    console.error("[HOMEWORK_GET_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
