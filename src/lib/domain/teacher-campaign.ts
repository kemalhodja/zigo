import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database,SponsoredTeacherCampaignSummary, TeacherCampaignRow, TeacherCampaignView } from "@/lib/supabase/database.types";

export const DEFAULT_SPONSORED_TARGETING = {
  minGrade: null,
  maxGrade: null,
  educationAreaIds: [] as number[],
};

export const sponsoredTargetingSchema = z.object({
  minGrade: z.number().int().min(1).max(12).nullable().optional(),
  maxGrade: z.number().int().min(1).max(12).nullable().optional(),
  educationAreaIds: z.array(z.number().int()).default([]),
});

export type SponsoredTargeting = z.infer<typeof sponsoredTargetingSchema>;

export function normalizeSponsoredTargeting(input?: Partial<SponsoredTargeting> | null): SponsoredTargeting {
  return {
    minGrade: typeof input?.minGrade === "number" ? input.minGrade : null,
    maxGrade: typeof input?.maxGrade === "number" ? input.maxGrade : null,
    educationAreaIds: Array.isArray(input?.educationAreaIds)
      ? Array.from(new Set(input.educationAreaIds.filter((id) => Number.isInteger(id) && id > 0)))
      : [],
  };
}

export const teacherCampaignSchema = z.object({
  headline: z.string().trim().min(3).max(120),
  tagline: z.string().trim().max(160).nullable().optional(),
  pitch: z.string().trim().max(2000).nullable().optional(),
  ctaLabel: z.string().trim().min(2).max(40).default("İletişime Geç"),
  ctaUrl: z.string().trim().url().max(2048).nullable().optional(),
  coverImageUrl: z.union([
    z.string().trim().length(0),
    z.string().trim().url().max(2048).nullable().optional(),
  ]),
  isPublished: z.boolean().default(false),
  isSponsored: z.boolean().default(false),
  sponsoredPackageDays: z.union([z.literal(7), z.literal(30)]).default(30),
  sponsoredTargeting: sponsoredTargetingSchema.optional(),
});

export type TeacherCampaignInput = z.infer<typeof teacherCampaignSchema>;

export function isTeacherCampaignSponsoredActive(
  campaign: Pick<TeacherCampaignRow, "is_published" | "is_sponsored" | "sponsored_status" | "sponsored_expires_at">,
) {
  if (!campaign.is_published || !campaign.is_sponsored) return false;
  if (campaign.sponsored_status !== "active") return false;
  if (!campaign.sponsored_expires_at) return true;
  return new Date(String(campaign.sponsored_expires_at)).getTime() > Date.now();
}

type RpcFn = (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: Error | null }>;

export async function upsertTeacherCampaign(
  supabase: SupabaseClient<Database>,
  input: TeacherCampaignInput,
) {
  const parsed = teacherCampaignSchema.parse(input);
  const sponsoredTargeting = parsed.isSponsored
    ? normalizeSponsoredTargeting(parsed.sponsoredTargeting ?? DEFAULT_SPONSORED_TARGETING)
    : null;
  const rpc = supabase.rpc as unknown as RpcFn;
  const { data, error } = await rpc("upsert_teacher_campaign", {
    next_headline: parsed.headline,
    next_tagline: parsed.tagline ?? null,
    next_pitch: parsed.pitch ?? null,
    next_cta_label: parsed.ctaLabel,
    next_cta_url: parsed.ctaUrl?.trim() ? parsed.ctaUrl.trim() : null,
    next_cover_image_url: parsed.coverImageUrl?.trim() ? parsed.coverImageUrl.trim() : null,
    next_is_published: parsed.isPublished,
    next_is_sponsored: parsed.isSponsored,
    next_sponsored_package_days: parsed.isSponsored ? parsed.sponsoredPackageDays : null,
    next_sponsored_targeting: sponsoredTargeting,
  });

  if (error) throw error;
  return data as TeacherCampaignRow;
}

export async function getTeacherCampaign(
  supabase: SupabaseClient<Database>,
  teacherId: string,
) {
  const rpc = supabase.rpc as unknown as RpcFn;
  const { data, error } = await rpc("get_teacher_campaign", {
    target_teacher_id: teacherId,
  });

  if (error) throw error;
  const rows = (data ?? []) as TeacherCampaignView[];
  return rows[0] ?? null;
}

export async function listSponsoredTeacherCampaigns(
  supabase: SupabaseClient<Database>,
  limit = 12,
  placement: "explore" | "profile_rail" | "feed_highlight" = "explore",
) {
  const rpc = supabase.rpc as unknown as RpcFn;
  const { data, error } = await rpc("list_sponsored_teacher_campaigns", {
    limit_count: limit,
    placement_key: placement,
  });

  if (!error) {
    return (data ?? []) as SponsoredTeacherCampaignSummary[];
  }

  const legacy = await rpc("list_sponsored_teacher_campaigns", {
    limit_count: limit,
  });

  if (legacy.error) throw legacy.error;
  return (legacy.data ?? []) as SponsoredTeacherCampaignSummary[];
}

export async function recordTeacherCampaignView(
  supabase: SupabaseClient<Database>,
  teacherId: string,
) {
  const rpc = supabase.rpc as unknown as RpcFn;
  const { error } = await rpc("record_teacher_campaign_view", {
    target_teacher_id: teacherId,
  });
  if (error) throw error;
}

export async function recordTeacherCampaignClick(
  supabase: SupabaseClient<Database>,
  teacherId: string,
) {
  const rpc = supabase.rpc as unknown as RpcFn;
  const { data, error } = await rpc("record_teacher_campaign_click", {
    target_teacher_id: teacherId,
  });

  if (error) throw error;
  if (!data) throw new Error("Campaign link could not be resolved.");
  return data as string;
}

export function resolveTeacherCampaignHref(teacherId: string) {
  return `/kampanya/${teacherId}`;
}

export async function isTeacherCampaignVisibleForViewer(
  supabase: SupabaseClient<Database>,
  teacherId: string,
  placement: "explore" | "profile_rail" | "feed_highlight" = "profile_rail",
) {
  const rpc = supabase.rpc as unknown as RpcFn;
  const { data, error } = await rpc("teacher_campaign_visible_for_viewer", {
    target_teacher_id: teacherId,
    placement_key: placement,
  });

  if (error) throw error;
  return Boolean(data);
}
