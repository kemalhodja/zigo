import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      // Fallback to mock if no API key is provided, but log warning
      console.warn("OPENAI_API_KEY is missing. Using mock AI response.");
      return NextResponse.json({
        role: "assistant",
        content: `Merhaba ${profile.full_name}! Sistem yöneticisi henüz OpenAI anahtarımı yapılandırmadı, ancak buradayım!`,
      });
    }

    const systemMessage = {
      role: "system",
      content: "Sen Zigo AI Mentor'sun. Öğrencilere nazik, motive edici ve eğitici bir dille yardımcı olan bir eğitim asistanısın. Cevaplarını kısa, anlaşılır ve eğitici tut.",
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Cost-effective model for production
        messages: [systemMessage, ...messages],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errData = await response.text();
      console.error("[OPENAI_API_ERROR]", errData);
      return NextResponse.json({ error: "Yapay zeka servisi şu an meşgul." }, { status: 500 });
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content || "Anlayamadım, tekrar sorar mısın?";

    return NextResponse.json({
      role: "assistant",
      content: reply,
    });
  } catch (error) {
    console.error("[AI_CHAT_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
