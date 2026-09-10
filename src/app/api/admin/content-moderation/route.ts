import { NextResponse } from "next/server";
import { z } from "zod";

import { requirePlatformAdmin } from "@/lib/domain/admin-auth";

const bulkActionSchema = z.object({
  action: z.enum(["bulk_approve", "bulk_hide", "bulk_delete", "bulk_escalate"]),
  contentIds: z.array(z.string().uuid()).min(1).max(100),
  contentType: z.enum(["post", "story", "reel", "comment", "profile"]),
  note: z.string().max(500).nullable().optional(),
});

const singleActionSchema = z.object({
  contentId: z.string().uuid(),
  contentType: z.enum(["post", "story", "reel", "comment", "profile"]),
  decision: z.enum(["approved", "hidden", "deleted", "escalated", "dismissed"]),
  note: z.string().max(500).nullable().optional(),
  escalationNote: z.string().max(500).nullable().optional(),
});

// GET: İçerik moderasyon kuyruğunu çek
export async function GET(request: Request) {
  try {
    const auth = await requirePlatformAdmin();
    if ("error" in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);

    const { data, error } = await (auth.supabase as any)
      .from("social_posts")
      .select(`
        id,
        post_type,
        author_id,
        content,
        media_url,
        ai_flagged,
        ai_flag_reason,
        moderation_priority,
        is_visible,
        created_at,
        users!inner(full_name, role)
      `)
      .or("ai_flagged.eq.true,moderation_priority.in.(high,critical)")
      .order("moderation_priority", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Şikayet sayılarını getir
    const postIds = (data ?? []).map((p: any) => p.id);
    const { data: reports } = postIds.length > 0
      ? await auth.supabase
          .from("content_reports")
          .select("post_id")
          .in("post_id", postIds)
          .is("resolved_at", null)
      : { data: [] };

    const reportCounts: Record<string, number> = {};
    for (const r of reports ?? []) {
      if (r.post_id) reportCounts[r.post_id] = (reportCounts[r.post_id] ?? 0) + 1;
    }

    const items = (data ?? []).map((post: any) => {
      const user = Array.isArray(post.users) ? post.users[0] : post.users;
      return {
        id: post.id,
        type: (post.post_type as "post" | "story" | "reel") ?? "post",
        authorId: post.author_id,
        authorName: (user as { full_name?: string })?.full_name ?? "—",
        authorRole: (user as { role?: string })?.role ?? "—",
        content: post.content ?? "",
        mediaUrl: post.media_url ?? null,
        aiFlagged: post.ai_flagged ?? false,
        aiFlagReason: post.ai_flag_reason ?? null,
        moderationPriority: (post.moderation_priority as "low" | "normal" | "high" | "critical") ?? "normal",
        reportCount: reportCounts[post.id] ?? 0,
        isVisible: post.is_visible ?? true,
        createdAt: post.created_at,
      };
    });

    return NextResponse.json({ data: items });
  } catch {
    return NextResponse.json({ error: "Kuyruk yüklenemedi." }, { status: 500 });
  }
}

// PATCH: Tekil içerik kararı
export async function PATCH(request: Request) {
  try {
    const auth = await requirePlatformAdmin();
    if ("error" in auth) return auth.error;

    const payload = singleActionSchema.parse(await request.json());

    // post görünürlüğünü güncelle
    if (payload.contentType === "post" || payload.contentType === "story" || payload.contentType === "reel") {
      const updates: Record<string, unknown> = {};
      if (payload.decision === "approved") {
        updates.is_visible = true;
        updates.moderation_priority = "low";
      } else if (payload.decision === "hidden" || payload.decision === "deleted") {
        updates.is_visible = false;
      } else if (payload.decision === "escalated") {
        updates.moderation_priority = "critical";
      }

      if (Object.keys(updates).length > 0) {
        await (auth.supabase as any)
          .from("social_posts")
          .update(updates)
          .eq("id", payload.contentId);
      }
    }

    // Karar logu
    await (auth.supabase as any).from("moderation_decisions").insert({
      moderator_id: auth.profile.id,
      content_type: payload.contentType,
      content_id: payload.contentId,
      decision: payload.decision,
      note: payload.note ?? null,
      is_escalated: payload.decision === "escalated",
      escalation_note: payload.escalationNote ?? null,
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Geçersiz istek verisi."
      : error instanceof Error ? error.message : "İşlem başarısız.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// POST: Toplu işlem
export async function POST(request: Request) {
  try {
    const auth = await requirePlatformAdmin();
    if ("error" in auth) return auth.error;

    const payload = bulkActionSchema.parse(await request.json());

    const updates: Record<string, unknown> = {};
    const decision =
      payload.action === "bulk_approve" ? "approved" :
      payload.action === "bulk_hide" ? "hidden" :
      payload.action === "bulk_delete" ? "deleted" :
      "escalated";

    if (payload.contentType === "post" || payload.contentType === "story" || payload.contentType === "reel") {
      if (payload.action === "bulk_approve") {
        updates.is_visible = true;
        updates.moderation_priority = "low";
      } else if (payload.action === "bulk_hide" || payload.action === "bulk_delete") {
        updates.is_visible = false;
      } else if (payload.action === "bulk_escalate") {
        updates.moderation_priority = "critical";
      }

      if (Object.keys(updates).length > 0) {
        await (auth.supabase as any)
          .from("social_posts")
          .update(updates)
          .in("id", payload.contentIds);
      }
    }

    // Karar logları
    const decisions = payload.contentIds.map((id) => ({
      moderator_id: auth.profile.id,
      content_type: payload.contentType,
      content_id: id,
      decision,
      note: payload.note ?? null,
      is_escalated: decision === "escalated",
    }));

    await (auth.supabase as any).from("moderation_decisions").insert(decisions);

    // Toplu işlem logu
    await (auth.supabase as any).from("moderation_bulk_actions").insert({
      moderator_id: auth.profile.id,
      action: payload.action,
      content_type: payload.contentType,
      content_ids: payload.contentIds,
      affected_count: payload.contentIds.length,
      note: payload.note ?? null,
    });

    return NextResponse.json({ data: { affectedCount: payload.contentIds.length } });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Geçersiz istek verisi."
      : error instanceof Error ? error.message : "Toplu işlem başarısız.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
