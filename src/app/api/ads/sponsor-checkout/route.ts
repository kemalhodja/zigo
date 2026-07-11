import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { getSponsorPricingOptions } from "@/lib/domain/sponsored-pricing";
import { getTeacherCampaign, upsertTeacherCampaign } from "@/lib/domain/teacher-campaign";
import { createClient } from "@/lib/supabase/server";

const sponsorCheckoutSchema = z.object({
  packageDays: z.union([z.literal(7), z.literal(30)]),
  headline: z.string().trim().min(3).max(120).optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
    }

    if (profile.role !== "teacher") {
      return NextResponse.json(
        { error: "Sponsorlu reklam vermek için öğretmen, kurum veya platform profiline sahip olmalısınız." },
        { status: 403 },
      );
    }

    const body = sponsorCheckoutSchema.parse(await request.json().catch(() => ({})));
    const options = getSponsorPricingOptions(profile);
    const selectedOption = options.find((opt) => opt.days === body.packageDays);

    if (!selectedOption) {
      return NextResponse.json({ error: "Geçersiz sponsorluk paketi süresi." }, { status: 400 });
    }

    // Dev billing bypass or local checkout simulation for instant activation
    const currentCampaign = await getTeacherCampaign(supabase, profile.id);
    const headline = body.headline || currentCampaign?.headline || `${profile.full_name} - Öne Çıkan Profil`;
    const expiresAt = new Date(Date.now() + body.packageDays * 24 * 60 * 60 * 1000).toISOString();

    await upsertTeacherCampaign(supabase, {
      headline,
      tagline: currentCampaign?.tagline ?? `${selectedOption.durationLabel} Sponsorlu Profil`,
      pitch: currentCampaign?.pitch ?? null,
      ctaLabel: currentCampaign?.cta_label ?? "İletişime Geç",
      ctaUrl: currentCampaign?.cta_url ?? null,
      coverImageUrl: currentCampaign?.cover_image_url ?? null,
      isPublished: true,
      isSponsored: true,
      sponsoredPackageDays: body.packageDays,
    });

    // Update status and expiration directly if RLS/table allows, or fallback via SQL/post updates
    const { error: campaignUpdateError } = await supabase
      .from("teacher_campaigns")
      .update({
        is_sponsored: true,
        is_published: true,
        sponsored_status: "active",
        sponsored_package_days: body.packageDays,
        sponsored_expires_at: expiresAt,
      })
      .eq("teacher_id", profile.id);

    if (campaignUpdateError) {
      // Log non-fatal if table update has strict RLS, upsert already marked it sponsored
      console.warn("Could not set active status via direct update:", campaignUpdateError.message);
    }

    // Also update their latest social posts to have sponsored badge active
    await supabase
      .from("social_posts")
      .update({
        sponsored_status: "active",
        sponsored_expires_at: expiresAt,
        sponsored_disclosure: "Sponsorlu",
        sponsored_label: `${profile.full_name} • Sponsorlu`,
      })
      .eq("author_id", profile.id);

    return NextResponse.json({
      data: {
        success: true,
        packageDays: body.packageDays,
        priceTry: selectedOption.priceTry,
        expiresAt,
        message: `${selectedOption.label} başarıyla aktifleştirildi! (${selectedOption.priceTry} TL)`,
      },
    });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Lütfen 7 veya 30 günlük geçerli bir paket seçin."
      : error instanceof Error
        ? error.message
        : "Sponsorluk işlemi tamamlanamadı.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
