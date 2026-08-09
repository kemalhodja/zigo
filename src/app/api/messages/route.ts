import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createAdminClient, hasServiceRoleEnv } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const dbClient = (hasServiceRoleEnv() ? createAdminClient() : null) ?? supabase;
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const peerId = searchParams.get("peerId");

    // Fetch conversation messages with a specific user
    if (peerId) {
      const { data: messages, error } = await dbClient
        .from("direct_messages" as any)
        .select("*")
        .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${peerId}),and(sender_id.eq.${peerId},receiver_id.eq.${profile.id})`)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) {
        // Fallback for missing table
        return NextResponse.json({ data: [] });
      }

      return NextResponse.json({ data: messages || [] });
    }

    // Fetch active conversation list for viewer
    const { data: conversations, error: convErr } = await dbClient
      .from("direct_messages" as any)
      .select("id, sender_id, receiver_id, content, created_at")
      .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
      .order("created_at", { ascending: false })
      .limit(50);

    if (convErr) {
      return NextResponse.json({ data: [] });
    }

    return NextResponse.json({ data: conversations || [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sunucu hatası" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const dbClient = (hasServiceRoleEnv() ? createAdminClient() : null) ?? supabase;
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      receiverId?: string;
      content?: string;
      mediaUrl?: string;
    };

    if (!body.receiverId) {
      return NextResponse.json({ error: "Alıcı kullanıcı belirtilmedi" }, { status: 400 });
    }

    if (!body.content?.trim() && !body.mediaUrl) {
      return NextResponse.json({ error: "Mesaj içeriği girmelisiniz" }, { status: 400 });
    }

    const { data: newMessage, error: insertErr } = await (dbClient
      .from("direct_messages") as any)
      .insert({
        sender_id: profile.id,
        receiver_id: body.receiverId,
        content: body.content?.trim() || "",
        media_url: body.mediaUrl || null,
        is_read: false,
      })
      .select("*")
      .single();

    if (insertErr || !newMessage) {
      return NextResponse.json({ error: "Mesaj gönderilemedi" }, { status: 500 });
    }

    return NextResponse.json({ data: newMessage });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sunucu hatası" },
      { status: 500 },
    );
  }
}
