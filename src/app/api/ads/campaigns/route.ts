import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { createAdminClient, hasServiceRoleEnv } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const dbClient = (hasServiceRoleEnv() ? createAdminClient() : null) ?? supabase;
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      existingPostId?: string;
      title?: string;
      caption?: string;
      targetUrl?: string;
      buttonText?: string;
      mediaUrl?: string;
      targetAudience?: "all" | "student" | "parent";
      city?: string | null;
      district?: string | null;
    };

    const targetAudience =
      body.targetAudience === "parent"
        ? "parent_only"
        : body.targetAudience === "student"
          ? "grade"
          : "all";

    const ctaLabel = body.buttonText || body.title || "Sponsorlu Reklam";

    // Method 1: Convert existing post to sponsored ad
    if (body.existingPostId) {
      const { data: post, error: fetchErr } = await dbClient
        .from("social_posts")
        .select("id, author_id")
        .eq("id", body.existingPostId)
        .single();

      if (fetchErr || !post) {
        return NextResponse.json({ error: "Gönderi bulunamadı" }, { status: 404 });
      }

      if (post.author_id !== profile.id) {
        return NextResponse.json({ error: "Bu gönderi sizin değil" }, { status: 403 });
      }

      const { error: updateErr } = await (dbClient
        .from("social_posts") as unknown as { update: (data: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<{ error: unknown }> } })
        .update({
          sponsored_label: ctaLabel,
          sponsored_target_url: body.targetUrl || null,
          sponsored_status: "pending",
          target_audience: targetAudience,
          city: body.city || null,
          district: body.district || null,
        })
        .eq("id", body.existingPostId);

      if (updateErr) {
        return NextResponse.json({ error: "Reklam güncellenemedi" }, { status: 500 });
      }

      return NextResponse.json({
        data: { message: "Reklamınız oluşturuldu ve Admin onayına gönderildi!" },
      });
    }

    // Method 2: Create brand new ad campaign post
    if (!body.caption && !body.title) {
      return NextResponse.json({ error: "Başlık veya açıklama girmelisiniz" }, { status: 400 });
    }

    const isVideo = Boolean(body.mediaUrl && /\.(mp4|mov|webm)(\?.*)?$/i.test(body.mediaUrl));
    const mediaType = isVideo ? "video" : body.mediaUrl ? "image" : "none";

    const { data: newPost, error: insertErr } = await (dbClient
      .from("social_posts") as unknown as { insert: (data: Record<string, unknown>) => { select: (cols?: string) => { single: () => Promise<{ data: { id: string } | null; error: unknown }> } } })
      .insert({
        author_id: profile.id,
        caption: body.caption || body.title || "Sponsorlu İçerik",
        title: body.title || null,
        media_url: body.mediaUrl || null,
        media_type: mediaType,
        is_reel: isVideo,
        post_type: "discussion",
        sponsored_label: ctaLabel,
        sponsored_target_url: body.targetUrl || null,
        sponsored_status: "pending",
        target_audience: targetAudience,
        city: body.city || null,
        district: body.district || null,
      })
      .select("id")
      .single();

    if (insertErr || !newPost) {
      return NextResponse.json({ error: "Reklam oluşturulamadı" }, { status: 500 });
    }

    return NextResponse.json({
      data: { id: newPost.id, message: "Reklam afişiniz yüklendi ve Admin onayına sunuldu!" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sunucu hatası" },
      { status: 500 },
    );
  }
}
