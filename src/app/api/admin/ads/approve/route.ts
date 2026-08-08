import { NextResponse } from "next/server";
import { isCurrentUserPlatformAdmin } from "@/lib/domain/admin";
import { createAdminClient, hasServiceRoleEnv } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const dbClient = (hasServiceRoleEnv() ? createAdminClient() : null) ?? supabase;
    const isAdmin = await isCurrentUserPlatformAdmin(supabase);

    if (!isAdmin) {
      return NextResponse.json({ error: "Yetkisiz işlem - Admin yetkisi gerekiyor" }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      postId?: string;
      action?: "approve" | "reject";
      rejectReason?: string;
    };

    if (!body.postId || !body.action) {
      return NextResponse.json({ error: "Eksik parametre" }, { status: 400 });
    }

    const newStatus = body.action === "approve" ? "active" : "rejected";

    const { error: updateErr } = await (dbClient
      .from("social_posts") as unknown as { update: (data: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<{ error: unknown }> } })
      .update({
        sponsored_status: newStatus,
        sponsored_disclosure: body.action === "reject" ? body.rejectReason || "Admin tarafından reddedildi" : null,
      })
      .eq("id", body.postId);

    if (updateErr) {
      return NextResponse.json({ error: "Reklam durumu güncellenemedi" }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        postId: body.postId,
        status: newStatus,
        message: body.action === "approve" ? "Reklam onaylandı ve yayına alındı!" : "Reklam reddedildi.",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sunucu hatası" },
      { status: 500 },
    );
  }
}
