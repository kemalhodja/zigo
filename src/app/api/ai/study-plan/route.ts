import { NextResponse } from "next/server";
import { z } from "zod";

import { respondWithDomainError } from "@/lib/domain/api-errors";
import { getCurrentProfile } from "@/lib/domain/profiles";
import {
  buildPlanPrompt,
  buildRuleBasedPlan,
  parseAiPlan,
  type PlanContext,
} from "@/lib/domain/study-plan";
import { captureServerEvent } from "@/lib/server/analytics";
import { createClient } from "@/lib/supabase/server";

const telemetrySchema = z
  .object({
    quizCount7d: z.number().int().min(0).max(500).default(0),
    gamePlays7d: z.number().int().min(0).max(500).default(0),
  })
  .partial();

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Telemetry pass 1: weekly focus minutes (north-star data).
    let weeklyFocusMinutes = 0;
    try {
      const { data: focus } = await supabase.rpc("get_weekly_focus_minutes");
      weeklyFocusMinutes = (focus ?? []).reduce(
        (sum, row) => sum + Number(row.focus_minutes ?? 0),
        0,
      );
    } catch {
      // non-fatal
    }

    // Telemetry pass 2: due review cards + weak-topic samples.
    const nowIso = new Date().toISOString();
    const [{ data: dueReviews }, body] = await Promise.all([
      supabase
        .from("review_items")
        .select("question_text")
        .eq("user_id", profile.id)
        .lte("due_at", nowIso)
        .order("due_at", { ascending: true })
        .limit(6),
      telemetrySchema.parse(await request.json().catch(() => ({}))),
    ]);

    const ctx: PlanContext = {
      displayName: profile.full_name?.split(" ")[0] || "şampiyon",
      weeklyFocusMinutes,
      dueReviewCount: dueReviews?.length ?? 0,
      reviewSampleTopics: (dueReviews ?? []).map((r) =>
        String(r.question_text).slice(0, 60),
      ),
      quizCount7d: body.quizCount7d ?? 0,
      gamePlays7d: body.gamePlays7d ?? 0,
    };

    // AI path with deterministic fallback.
    let plan = null as ReturnType<typeof buildRuleBasedPlan> | null;
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (apiKey && !apiKey.startsWith("sk-mock")) {
      try {
        const prompt = buildPlanPrompt(ctx);
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: prompt.system },
              { role: "user", content: prompt.user },
            ],
            max_tokens: 600,
            temperature: 0.7,
            response_format: { type: "json_object" },
          }),
          signal: AbortSignal.timeout(20_000),
        });
        if (response.ok) {
          const data = await response.json();
          plan = parseAiPlan(String(data.choices?.[0]?.message?.content ?? ""));
        }
      } catch {
        // fall through to rule-based
      }
    }

    if (!plan) {
      plan = buildRuleBasedPlan(ctx);
    }

    void captureServerEvent(profile.id, "study_plan_generated", {
      source: plan.source,
      blocks: plan.blocks.length,
      weekly_focus_minutes: weeklyFocusMinutes,
      due_reviews: ctx.dueReviewCount,
    });

    return NextResponse.json({ data: plan });
  } catch (error) {
    return respondWithDomainError(error, "Plan oluşturulamadı.");
  }
}
