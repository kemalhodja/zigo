import { NextResponse } from "next/server";

import { respondWithDomainError } from "@/lib/domain/api-errors";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from("review_items")
      .select("id, question_text, options, due_at")
      .eq("user_id", profile.id)
      .lte("due_at", nowIso)
      .order("due_at", { ascending: true })
      .limit(20);

    if (error) {
      return NextResponse.json({ error: "Tekrarlar alınamadı." }, { status: 500 });
    }

    const nextDue = await supabase
      .from("review_items")
      .select("due_at")
      .eq("user_id", profile.id)
      .gt("due_at", nowIso)
      .order("due_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      data: {
        cards: data ?? [],
        totalCards: (data ?? []).length,
        nextDueAt: nextDue.data?.due_at ?? null,
      },
    });
  } catch (error) {
    return respondWithDomainError(error, "Tekrarlar alınamadı.");
  }
}
