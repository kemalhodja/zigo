import { NextResponse } from "next/server";

import { requirePlatformAdmin } from "@/lib/domain/admin-auth";
import { createAdminClient, hasServiceRoleEnv } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const auth = await requirePlatformAdmin();
    if ("error" in auth) return auth.error;
    
    const dbClient = (hasServiceRoleEnv() ? createAdminClient() : null) ?? auth.supabase;

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
