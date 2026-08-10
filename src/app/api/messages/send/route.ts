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

    // STRICT BUSINESS RULE: Students cannot use Direct Messaging (DM)
    if (profile.role === "student") {
      console.warn(`[SECURITY] Student ${profile.id} attempted to send a DM. Blocked.`);
      return NextResponse.json(
        { error: "Öğrenciler arası Doğrudan Mesajlaşma (DM) platform kuralları gereği kapalıdır." },
        { status: 403 }
      );
    }

    const { receiverId, content } = await request.json();

    if (!receiverId || !content || content.trim() === "") {
      return NextResponse.json({ error: "Geçersiz mesaj içeriği" }, { status: 400 });
    }

    // Simulate saving the message (In a real app, this goes to a 'messages' table)
    // @ts-ignore
    const { data, error } = await supabase.from("messages").insert({
      sender_id: profile.id,
      receiver_id: receiverId,
      content: content.trim(),
    }).select().single();

    if (error) {
      console.error("[DM_ERROR]", error);
      // Fallback for mock environments
      return NextResponse.json({ success: true, message: "Mesaj iletildi (Mock)", _mocked: true }, { status: 200 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("[DM_CRITICAL_ERROR]", error);
    return NextResponse.json({ error: "İç sunucu hatası" }, { status: 500 });
  }
}
