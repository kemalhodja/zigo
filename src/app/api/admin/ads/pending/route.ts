import { NextResponse } from "next/server";

import { isCurrentUserPlatformAdmin } from "@/lib/domain/admin";
import { createAdminClient, hasServiceRoleEnv } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const dbClient = (hasServiceRoleEnv() ? createAdminClient() : null) ?? supabase;
    const isAdmin = await isCurrentUserPlatformAdmin(supabase);

    if (!isAdmin) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const { data, error } = await dbClient
      .from("social_posts")
      .select(`
        id,
        caption,
        title,
        media_url,
        media_type,
        target_audience,
        created_at,
        author:author_id (
          full_name
        )
      `)
      .eq("sponsored_status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "Veriler çekilemedi" }, { status: 500 });
    }

    const formatted = (data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id,
      author_name: (row.author as unknown as { full_name?: string })?.full_name ?? "Kullanıcı",
      title: row.title,
      caption: row.caption,
      media_url: row.media_url,
      media_type: row.media_type,
      target_audience: row.target_audience,
      city: null,
      district: null,
      created_at: row.created_at,
    }));

    return NextResponse.json({ data: formatted });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sunucu hatası" },
      { status: 500 },
    );
  }
}
