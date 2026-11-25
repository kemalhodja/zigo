import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { untypedFrom } from "@/lib/supabase/untyped-tables";

export const runtime = "nodejs";

type MediaUploadRow = {
  id: string;
  object_path: string;
  byte_size?: number | null;
  created_at: string;
  status?: string | null;
  deleted_at?: string | null;
};

/**
 * Vercel Cron Job — her gün 03:00 UTC (06:00 Türkiye) çalışır.
 * 24 saatten eski ve hiçbir social_posts veya stories kaydında referans edilmeyen
 * yetim (orphan) media_uploads dosyalarını Supabase Storage'dan silerek
 * depolama kotasını ve maliyetini korur.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "Cron secret missing." }, { status: 503 });
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Admin client unavailable" }, { status: 503 });
  }

  const cutoffIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: candidatesRaw, error: fetchError } = await untypedFrom(admin, "media_uploads")
    .select("id, object_path, byte_size, created_at, status, deleted_at")
    .is("deleted_at", null)
    .lt("created_at", cutoffIso)
    .order("created_at", { ascending: true })
    .limit(100);

  if (fetchError) {
    console.error("[ORPHAN_MEDIA_CRON_FETCH_ERROR]", fetchError.message);
    return NextResponse.json({ error: "Failed to query media uploads." }, { status: 500 });
  }

  const candidates = (candidatesRaw ?? []) as MediaUploadRow[];
  if (candidates.length === 0) {
    return NextResponse.json({ ok: true, scanned: 0, deleted: 0, freedBytes: 0 });
  }

  // Fetch recent referenced media_url values from posts & stories to avoid deleting active media
  const [postsRes, storiesRes] = await Promise.all([
    admin.from("social_posts").select("media_url").not("media_url", "is", null).limit(5000),
    admin.from("stories").select("media_url").not("media_url", "is", null).limit(2000),
  ]);

  const referencedBlob = [
    ...((postsRes.data ?? []) as Array<{ media_url?: string | null }>),
    ...((storiesRes.data ?? []) as Array<{ media_url?: string | null }>),
  ]
    .map((row) => row.media_url ?? "")
    .filter(Boolean)
    .join("\n");

  const orphans = candidates.filter((item) => {
    const rawPath = item.object_path;
    const encodedPath = encodeURIComponent(rawPath);
    return !referencedBlob.includes(rawPath) && !referencedBlob.includes(encodedPath);
  });

  if (orphans.length === 0) {
    return NextResponse.json({
      ok: true,
      scanned: candidates.length,
      deleted: 0,
      freedBytes: 0,
    });
  }

  const orphanPaths = orphans.map((o) => o.object_path);
  const { error: removeError } = await admin.storage.from("social-media").remove(orphanPaths);
  if (removeError) {
    console.error("[ORPHAN_MEDIA_CRON_REMOVE_ERROR]", removeError.message);
    return NextResponse.json({ error: "Failed to remove orphan storage objects." }, { status: 500 });
  }

  const nowIso = new Date().toISOString();
  const orphanIds = orphans.map((o) => o.id);
  const { error: updateError } = await untypedFrom(admin, "media_uploads")
    .update({ status: "deleted", deleted_at: nowIso })
    .in("id", orphanIds);

  if (updateError) {
    console.error("[ORPHAN_MEDIA_CRON_UPDATE_ERROR]", updateError.message);
  }

  const freedBytes = orphans.reduce((sum, item) => sum + (Number(item.byte_size) || 0), 0);

  return NextResponse.json({
    ok: true,
    scanned: candidates.length,
    deleted: orphans.length,
    freedBytes,
  });
}
