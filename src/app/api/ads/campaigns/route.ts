import { NextResponse } from "next/server";

import { getSiteUrl } from "@/lib/domain/deploy-config";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { getUserSubscription } from "@/lib/domain/subscription";
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

    // Role check: Students and parents cannot publish sponsored ads
    if (profile.role === "student" || profile.role === "parent") {
      return NextResponse.json(
        { error: "Yalnızca eğitmenler, kurumlar ve yayıncılar sponsorlu reklam verebilir." },
        { status: 403 },
      );
    }

    // Subscription check: Creating sponsored ads requires active Zigo Plus subscription (unless admin)
    const isPrivileged =
      profile.role === "platform" ||
      Boolean((profile as unknown as { is_platform_admin?: boolean }).is_platform_admin);

    if (!isPrivileged) {
      const subscription = await getUserSubscription(supabase, profile.id);
      if (!subscription.isPremium) {
        return NextResponse.json(
          {
            error: "Sponsorlu reklam oluşturmak için aktif bir Zigo Plus aboneliğiniz olması gerekmektedir.",
            code: "SUBSCRIPTION_REQUIRED",
          },
          { status: 403 },
        );
      }
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

    const ctaLabel = (body.buttonText || body.title || "Sponsorlu Reklam").trim() || "Sponsorlu Reklam";
    const siteUrl = getSiteUrl();
    const rawTargetUrl = body.targetUrl?.trim();
    const targetUrl =
      rawTargetUrl && rawTargetUrl.length >= 8
        ? rawTargetUrl
        : `${siteUrl}/profile/${profile.id}`;

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

      if (post.author_id !== profile.id && !isPrivileged) {
        return NextResponse.json({ error: "Bu gönderi sizin değil" }, { status: 403 });
      }

      const { error: updateErr } = await (dbClient
        .from("social_posts") as unknown as {
          update: (data: Record<string, unknown>) => {
            eq: (col: string, val: string) => Promise<{ error: unknown }>;
          };
        })
        .update({
          sponsored_label: ctaLabel,
          sponsored_target_url: targetUrl,
          sponsored_status: "pending",
          target_audience: targetAudience,
          city: body.city || null,
          district: body.district || null,
        })
        .eq("id", body.existingPostId);

      if (updateErr) {
        console.error("[ADS_CAMPAIGN_UPDATE_ERROR]", updateErr);
        const errMsg =
          updateErr && typeof updateErr === "object" && "message" in updateErr
            ? String((updateErr as { message: unknown }).message)
            : "Reklam güncellenemedi";
        return NextResponse.json({ error: errMsg }, { status: 500 });
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
    const mediaType = isVideo ? "video" : "image";
    const postType = isVideo ? "micro" : "normal";
    const caption = (body.caption || body.title || "Sponsorlu İçerik").trim().slice(0, 2200) || "Sponsorlu İçerik";

    // Attempt to get creator's education area if available
    let areaId: number | null = null;
    try {
      const { data: userInterest } = await dbClient
        .from("user_interests")
        .select("area_id")
        .eq("user_id", profile.id)
        .limit(1)
        .maybeSingle();
      if (userInterest?.area_id) {
        areaId = userInterest.area_id;
      }
    } catch {
      // Area is optional
    }

    const { data: newPost, error: insertErr } = await (dbClient
      .from("social_posts") as unknown as {
        insert: (data: Record<string, unknown>) => {
          select: (cols?: string) => {
            single: () => Promise<{ data: { id: string } | null; error: unknown }>;
          };
        };
      })
      .insert({
        author_id: profile.id,
        caption,
        title: body.title || null,
        media_url: body.mediaUrl || null,
        media_type: mediaType,
        is_reel: isVideo,
        post_type: postType,
        area_id: areaId,
        sponsored_label: ctaLabel,
        sponsored_target_url: targetUrl,
        sponsored_status: "pending",
        target_audience: targetAudience,
        city: body.city || null,
        district: body.district || null,
        is_discoverable: true,
      })
      .select("id")
      .single();

    if (insertErr || !newPost) {
      console.error("[ADS_CAMPAIGN_INSERT_ERROR]", insertErr);
      const errMsg =
        insertErr && typeof insertErr === "object" && "message" in insertErr
          ? String((insertErr as { message: unknown }).message)
          : "Reklam oluşturulamadı";
      return NextResponse.json({ error: errMsg }, { status: 500 });
    }

    return NextResponse.json({
      data: { id: newPost.id, message: "Reklam afişiniz yüklendi ve Admin onayına sunuldu!" },
    });
  } catch (err) {
    console.error("[ADS_CAMPAIGN_ROUTE_EXCEPTION]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sunucu hatası" },
      { status: 500 },
    );
  }
}

