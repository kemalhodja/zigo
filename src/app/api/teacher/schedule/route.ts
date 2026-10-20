import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

const schedulePlanSchema = z.object({
  title: z.string().trim().min(2).max(120),
  subject: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  recurrence: z.enum(["once", "weekly", "daily"]).default("once"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#6366f1"),
  classGroupId: z.string().uuid().optional(),
});

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from") ?? new Date().toISOString();
    const to = searchParams.get("to") ?? new Date(Date.now() + 30 * 86_400_000).toISOString();

    const { data, error } = await (supabase as any)
      .from("lesson_plans")
      .select("*")
      .eq("teacher_id", profile.id)
      .gte("start_date", from)
      .lte("start_date", to)
      .order("start_date", { ascending: true })
      .limit(100);

    if (error) return NextResponse.json({ error: "Ders planı yüklenemedi." }, { status: 500 });
    return NextResponse.json({ plans: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const allowedRoles = ["teacher", "education_institution", "education_platform"];
    if (!allowedRoles.includes(profile.role as string)) {
      return NextResponse.json({ error: "Yalnızca öğretmenler ders planı oluşturabilir." }, { status: 403 });
    }

    const parsed = schedulePlanSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Ders planı bilgileri geçersiz." }, { status: 400 });
    }

    const { title, subject, description, startDate, endDate, recurrence, color, classGroupId } = parsed.data;

    const { data, error } = await (supabase as any)
      .from("lesson_plans")
      .insert({
        teacher_id: profile.id,
        title,
        subject,
        description: description ?? null,
        start_date: startDate,
        end_date: endDate ?? null,
        recurrence,
        color,
        class_group_id: classGroupId ?? null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[LESSON_PLAN_CREATE_ERROR]", error);
      return NextResponse.json({ error: "Ders planı oluşturulamadı." }, { status: 500 });
    }

    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID gerekli." }, { status: 400 });

    const { error } = await (supabase as any)
      .from("lesson_plans")
      .delete()
      .eq("id", id)
      .eq("teacher_id", profile.id);

    if (error) return NextResponse.json({ error: "Silinemedi." }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
