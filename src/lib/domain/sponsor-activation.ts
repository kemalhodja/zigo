import type { SupabaseClient } from "@supabase/supabase-js";

import { getSiteUrl } from "@/lib/domain/deploy-config";
import type { SponsorPackageDuration } from "@/lib/domain/sponsored-pricing";
import { getTeacherCampaign, upsertTeacherCampaign } from "@/lib/domain/teacher-campaign";
import type { Database } from "@/lib/supabase/database.types";

export async function activateSponsorBoost(
  supabase: SupabaseClient<Database>,
  input: {
    userId: string;
    fullName: string;
    packageDays: SponsorPackageDuration;
    headline?: string | null;
    priceTry?: number;
  },
) {
  const currentCampaign = await getTeacherCampaign(supabase, input.userId);
  const headline =
    input.headline?.trim() ||
    currentCampaign?.headline ||
    `${input.fullName} - Öne Çıkan Profil`;
  const expiresAt = new Date(Date.now() + input.packageDays * 24 * 60 * 60 * 1000).toISOString();

  await upsertTeacherCampaign(supabase, {
    headline,
    tagline: currentCampaign?.tagline ?? `${input.packageDays} günlük Sponsorlu Profil`,
    pitch: currentCampaign?.pitch ?? null,
    ctaLabel: currentCampaign?.cta_label ?? "İletişime Geç",
    ctaUrl: currentCampaign?.cta_url ?? null,
    coverImageUrl: currentCampaign?.cover_image_url ?? null,
    isPublished: true,
    isSponsored: true,
    sponsoredPackageDays: input.packageDays,
  });

  const { error: campaignUpdateError } = await supabase
    .from("teacher_campaigns")
    .update({
      is_sponsored: true,
      is_published: true,
      sponsored_status: "active",
      sponsored_package_days: input.packageDays,
      sponsored_expires_at: expiresAt,
    })
    .eq("teacher_id", input.userId);

  if (campaignUpdateError) {
    console.warn("Could not set active sponsor status:", campaignUpdateError.message);
  }

  await supabase
    .from("social_posts")
    .update({
      sponsored_status: "active",
      sponsored_expires_at: expiresAt,
      sponsored_disclosure: "Sponsorlu",
      sponsored_label: `${input.fullName} • Sponsorlu`,
    })
    .eq("author_id", input.userId);

  return { expiresAt, headline, priceTry: input.priceTry ?? null };
}

export async function createSponsorBoostCheckoutSession(input: {
  userId: string;
  email: string;
  fullName: string;
  packageDays: SponsorPackageDuration;
  priceTry: number;
  label: string;
  headline?: string;
}) {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) {
    throw new Error("Stripe is not configured for sponsor checkout.");
  }

  const siteUrl = getSiteUrl();
  const unitAmount = Math.round(input.priceTry * 100);
  const body = new URLSearchParams({
    mode: "payment",
    success_url: `${siteUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}&kind=sponsor`,
    cancel_url: `${siteUrl}/profile?billing=sponsor_cancelled`,
    client_reference_id: input.userId,
    customer_email: input.email,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "try",
    "line_items[0][price_data][unit_amount]": String(unitAmount),
    "line_items[0][price_data][product_data][name]": input.label,
    "metadata[kind]": "sponsor_boost",
    "metadata[package_days]": String(input.packageDays),
    "metadata[user_id]": input.userId,
    "metadata[full_name]": input.fullName.slice(0, 120),
  });

  if (input.headline?.trim()) {
    body.set("metadata[headline]", input.headline.trim().slice(0, 120));
  }

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const payload = (await response.json()) as { id?: string; url?: string; error?: { message?: string } };
  if (!response.ok || !payload.url) {
    throw new Error(payload.error?.message ?? "Sponsor Stripe checkout could not be created.");
  }

  return payload;
}
