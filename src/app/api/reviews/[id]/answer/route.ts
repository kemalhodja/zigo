import { NextResponse } from "next/server";
import { z } from "zod";

import { respondWithDomainError } from "@/lib/domain/api-errors";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { applyReview, dueDateFrom, type ReviewScheduleState } from "@/lib/domain/spaced-repetition";
import { captureServerEvent } from "@/lib/server/analytics";
import { createClient } from "@/lib/supabase/server";

const answerSchema = z.object({ known: z.boolean() });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json({ error: "Geçersiz kart." }, { status: 400 });
    }

    const body = answerSchema.parse(await request.json().catch(() => ({})));

    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: item } = await supabase
      .from("review_items")
      .select("ease_factor, interval_days, repetitions")
      .eq("id", id)
      .eq("user_id", profile.id)
      .maybeSingle();

    if (!item) {
      return NextResponse.json({ error: "Kart bulunamadı." }, { status: 404 });
    }

    const current: ReviewScheduleState = {
      easeFactor: Number(item.ease_factor),
      intervalDays: Number(item.interval_days),
      repetitions: Number(item.repetitions),
    };
    const scheduled = applyReview(current, body.known);
    const dueAt = dueDateFrom(new Date(), scheduled.nextIntervalDays);

    const { error: updateError } = await supabase
      .from("review_items")
      .update({
        ease_factor: scheduled.easeFactor,
        interval_days: scheduled.intervalDays,
        repetitions: scheduled.repetitions,
        due_at: dueAt.toISOString(),
        last_reviewed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", profile.id);

    if (updateError) {
      return NextResponse.json({ error: "Kart güncellenemedi." }, { status: 500 });
    }

    void captureServerEvent(profile.id, "review_answered", {
      known: body.known,
      next_interval_days: scheduled.nextIntervalDays,
    });

    return NextResponse.json({
      data: {
        nextDueAt: dueAt.toISOString(),
        nextIntervalDays: scheduled.nextIntervalDays,
      },
    });
  } catch (error) {
    return respondWithDomainError(error, "Cevap kaydedilemedi.");
  }
}
