import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing text payload" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // If no key is set, we just assume it's safe to not break the app flow
      return NextResponse.json({ safe: true, provider: "none" });
    }

    const response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ input: text }),
    });

    if (!response.ok) {
      console.error(`OpenAI Moderation API Error: ${response.status}`);
      // Fallback to safe if API fails so users aren't blocked from posting
      return NextResponse.json({ safe: true, provider: "openai_error" });
    }

    const data = await response.json();
    const result = data.results[0];

    const isFlagged = result.flagged;
    let reason = "AI Flagged";
    
    if (isFlagged) {
      const categories = result.categories;
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
    // Don't break the app, assume safe if there's a timeout/error
    return NextResponse.json({ safe: true, provider: "error_fallback" });
  }
}
