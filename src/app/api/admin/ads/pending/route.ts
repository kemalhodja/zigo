import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/domain/admin-auth";
import { createAdminClient, hasServiceRoleEnv } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const auth = await requirePlatformAdmin();
    if ("error" in auth) return auth.error;
    
    const dbClient = (hasServiceRoleEnv() ? createAdminClient() : null) ?? auth.supabase;

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
