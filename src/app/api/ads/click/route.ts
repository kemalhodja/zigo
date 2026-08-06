import { NextResponse } from "next/server";
import { createAdminClient, hasServiceRoleEnv } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const dbClient = (hasServiceRoleEnv() ? createAdminClient() : null) ?? supabase;

    const body = (await request.json().catch(() => ({}))) as { postId?: string };
    if (!body.postId) {
      return NextResponse.json({ error: "Post ID eksik" }, { status: 400 });
    }

    // Increment click count for the sponsored post
    const { data: post, error: fetchErr } = await dbClient
      .from("social_posts")
      .select("sponsored_click_count, sponsored_target_url")
      .eq("id", body.postId)
      .maybeSingle();

    if (fetchErr || !post) {
      return NextResponse.json({ error: "Reklam bulunamadı" }, { status: 404 });
    }

    const newClickCount = (post.sponsored_click_count || 0) + 1;

    await (dbClient.from("social_posts") as any)
      .update({ sponsored_click_count: newClickCount })
      .eq("id", body.postId);

    return NextResponse.json({
      data: {
        clickCount: newClickCount,
        targetUrl: post.sponsored_target_url || null,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sunucu hatası" },
      { status: 500 },
    );
  }
}
