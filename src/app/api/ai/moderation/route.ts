import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { checkRateLimitAsync } from "@/lib/server/rate-limit";
import { createClient } from "@/lib/supabase/server";

const MAX_MODERATION_TEXT_LENGTH = 5_000;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = await checkRateLimitAsync(`ai-moderation:${profile.id}`, 30, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Moderasyon istek limitine ulaştın. Lütfen biraz sonra tekrar dene.", code: "RATE_LIMITED" },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
      );
    }

    const dailyLimit = await checkRateLimitAsync(`ai-moderation:daily:${profile.id}`, 300, 86_400_000);
    if (!dailyLimit.allowed) {
      return NextResponse.json(
        { error: "Günlük moderasyon kotasına ulaştın.", code: "DAILY_QUOTA_EXCEEDED" },
        { status: 429, headers: { "Retry-After": String(dailyLimit.retryAfterSeconds) } },
      );
    }

    const body = (await request.json().catch(() => null)) as { text?: unknown } | null;
    const text = typeof body?.text === "string" ? body.text.trim() : "";

    if (!text) {
      return NextResponse.json({ error: "Missing text payload" }, { status: 400 });
    }

    if (text.length > MAX_MODERATION_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Metin en fazla ${MAX_MODERATION_TEXT_LENGTH} karakter olabilir.` },
        { status: 400 },
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ safe: true, provider: "none" });
    }

    const response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ input: text }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error(`OpenAI Moderation API Error: ${response.status}`);
      return NextResponse.json({ safe: true, provider: "openai_error" });
    }

    const data = await response.json();
    const result = data.results?.[0];
    if (!result) {
      return NextResponse.json({ safe: true, provider: "openai_empty" });
    }

    const isFlagged = Boolean(result.flagged);
    let reason = "AI Flagged";

    if (isFlagged && result.categories) {
      const categories = result.categories as Record<string, boolean>;
      const highestCategory = Object.keys(categories).find((key) => categories[key] === true);
      if (highestCategory) {
        reason = highestCategory;
      }
    }

    return NextResponse.json({
      safe: !isFlagged,
      needsReview: isFlagged,
      reason: isFlagged ? reason : undefined,
      provider: "openai",
    });
  } catch (error) {
    console.error("AI Moderation Route Error:", error);
    return NextResponse.json({ safe: true, provider: "error_fallback" });
  }
}
