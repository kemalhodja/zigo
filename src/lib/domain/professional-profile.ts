import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { EducationOrganizationType } from "@/lib/domain/education-organization";
import { resolveOrganizationBillingTier } from "@/lib/domain/education-organization";
import { getTeacherProfessionalProfileBundle } from "@/lib/domain/platform-activity";
import type { UserProfile } from "@/lib/domain/profiles";
import type { Database } from "@/lib/supabase/database.types";
import type { EducationDegreeType, TeachingStyleType } from "@/lib/supabase/database.types";

export type EducationDegree = EducationDegreeType;
export type TeachingStyle = TeachingStyleType;
export type TeacherProfileExtras = Database["public"]["Tables"]["teacher_profile_extras"]["Row"];
export type InstitutionProfileExtras = Database["public"]["Tables"]["institution_profile_extras"]["Row"];
export type EducationPlatformProfileExtras =
  Database["public"]["Tables"]["education_platform_profile_extras"]["Row"];

export type ProfessionalProfileKind = "teacher" | "institution" | "platform";
export type ProfessionalBadgeType = "gold" | "platinum" | "verified";
export type ProfileAvailabilityStatus = "available" | "busy" | "scheduled";

export type ProfessionalProfileDetails = {
  certificates?: string[];
  educationHistory?: string[];
  subjects?: string[];
  [key: string]: unknown;
};

export type ProfessionalProfilePortfolioData = Awaited<ReturnType<typeof getProfessionalProfilePortfolio>>;

export const badgeTypeSchema = z.enum(["gold", "platinum", "verified"]);
export const availabilityStatusSchema = z.enum(["available", "busy", "scheduled"]);

export const portfolioEnhancementSchema = z.object({
  badgeType: badgeTypeSchema.optional(),
  videoIntroUrl: z.string().trim().url().max(500).optional(),
  softSkills: z.array(z.string().trim().min(2).max(40)).max(12).optional(),
  availabilityStatus: availabilityStatusSchema.optional(),
  availabilityNote: z.string().trim().max(120).optional(),
  certificates: z.array(z.string().trim().min(2).max(120)).max(10).optional(),
  educationHistory: z.array(z.string().trim().min(2).max(200)).max(10).optional(),
});

export const educationDegreeSchema = z.enum(["lisans", "yuksek_lisans", "doktora"]);
export const teachingStyleSchema = z.enum(["visual", "practical", "theory"]);

export const professionalGeneralStepSchema = z.object({
  fullName: z.string().trim().min(2).max(100).optional(),
  bio: z.string().trim().min(10, "Hakkında en az 10 karakter olmalı.").max(500),
  avatarUrl: z.string().trim().url().max(500).optional(),
});

export const teacherExpertiseStepSchema = z.object({
  cvUrl: z.string().trim().url().max(500).optional(),
  yearsOfExperience: z.coerce.number().int().min(1, "Deneyim yılı zorunludur.").max(60),
  educationDegree: educationDegreeSchema,
  teachingStyle: teachingStyleSchema,
});

export const teacherFinancialStepSchema = z.object({
  hourlyRate: z.coerce.number().min(0).max(100000),
  responseTimeMinutes: z.coerce.number().int().min(5).max(1440),
  lessonAcceptanceRatePercent: z.coerce.number().int().min(0).max(100),
  contactSummary: z.string().trim().max(200).optional(),
});

export const institutionExpertiseStepSchema = z.object({
  licenseNumber: z
    .string()
    .trim()
    .min(4, "MEB ruhsat numarası zorunludur.")
    .max(64),
  capacity: z.coerce.number().int().min(1).max(100000),
  branchCount: z.coerce.number().int().min(1).max(500),
  accreditation: z.array(z.string().trim().min(2).max(120)).min(1, "En az bir akreditasyon ekleyin."),
  services: z.array(z.string().trim().min(2).max(120)).min(1, "En az bir hizmet ekleyin."),
});

export const institutionContactStepSchema = z.object({
  responseTimeMinutes: z.coerce.number().int().min(5).max(1440),
  contactSummary: z.string().trim().max(200).optional(),
});

export const platformExpertiseStepSchema = z.object({
  contentCount: z.coerce.number().int().min(0),
  userBaseSize: z.coerce.number().int().min(0),
  subscriptionModel: z.string().trim().min(2).max(120),
  integrationDocsUrl: z.string().trim().url().max(500).optional(),
});

export const platformContactStepSchema = institutionContactStepSchema;

export const upsertTeacherProfileExtrasSchema = teacherExpertiseStepSchema
  .merge(teacherFinancialStepSchema)
  .merge(portfolioEnhancementSchema);
export const upsertInstitutionProfileExtrasSchema = institutionExpertiseStepSchema
  .merge(institutionContactStepSchema)
  .merge(portfolioEnhancementSchema);
export const upsertPlatformProfileExtrasSchema = platformExpertiseStepSchema
  .merge(platformContactStepSchema)
  .merge(portfolioEnhancementSchema);

export function resolveProfessionalProfileKind(
  profile: Pick<UserProfile, "role" | "organization_type">,
): ProfessionalProfileKind | null {
  if (profile.role === "platform") return "platform";
  if (profile.role !== "teacher") return null;
  if (!profile.organization_type) return "teacher";
  if (profile.organization_type === "egitim_platformu") return "platform";
  return "institution";
}

export function isVerifiedExpertTeacher(extras: Pick<TeacherProfileExtras, "years_of_experience" | "education_degree"> | null) {
  return Boolean(extras && extras.years_of_experience > 0 && extras.education_degree);
}

export function isOfficialInstitution(extras: Pick<InstitutionProfileExtras, "license_number"> | null) {
  return Boolean(extras?.license_number && extras.license_number.trim().length >= 4);
}

const TEACHING_STYLE_LABELS: Record<TeachingStyle, string> = {
  visual: "Görsel",
  practical: "Uygulamalı",
  theory: "Teorik",
};

const DEGREE_LABELS: Record<EducationDegree, string> = {
  lisans: "Lisans",
  yuksek_lisans: "Yüksek Lisans",
  doktora: "Doktora",
};

export function teachingStyleLabel(style: TeachingStyle | null | undefined) {
  return style ? TEACHING_STYLE_LABELS[style] : null;
}

export function educationDegreeLabel(degree: EducationDegree | null | undefined) {
  return degree ? DEGREE_LABELS[degree] : null;
}

const BADGE_LABELS: Record<ProfessionalBadgeType, string> = {
  gold: "Altın Rozet",
  platinum: "Platin Rozet",
  verified: "Doğrulanmış",
};

export function resolveProfessionalBadgeLabel(badge: ProfessionalBadgeType | null | undefined) {
  return badge ? BADGE_LABELS[badge] : null;
}

export function resolveAutoBadgeType(
  profile: Pick<UserProfile, "is_verified">,
  extras: Pick<TeacherProfileExtras, "years_of_experience" | "education_degree"> | null,
): ProfessionalBadgeType | null {
  if (isVerifiedExpertTeacher(extras) && profile.is_verified) return "gold";
  if (profile.is_verified) return "verified";
  return null;
}

function buildDetailsPayload(input: z.infer<typeof portfolioEnhancementSchema>): ProfessionalProfileDetails {
  const details: ProfessionalProfileDetails = {};
  if (input.certificates?.length) details.certificates = input.certificates;
  if (input.educationHistory?.length) details.educationHistory = input.educationHistory;
  return details;
}

function buildPortfolioRpcExtras(parsed: z.infer<typeof portfolioEnhancementSchema>) {
  const details = buildDetailsPayload(parsed);
  return {
    next_badge_type: parsed.badgeType ?? null,
    next_video_intro_url: parsed.videoIntroUrl ?? null,
    next_soft_skills: parsed.softSkills ?? null,
    next_availability_status: parsed.availabilityStatus ?? null,
    next_availability_note: parsed.availabilityNote ?? null,
    next_details: Object.keys(details).length > 0 ? (details as Database["public"]["Tables"]["teacher_profile_extras"]["Row"]["details"]) : null,
  };
}

export async function getTeacherProfileExtras(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<TeacherProfileExtras | null> {
  const { data, error } = await supabase
    .from("teacher_profile_extras")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getInstitutionProfileExtras(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<InstitutionProfileExtras | null> {
  const { data, error } = await supabase
    .from("institution_profile_extras")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getEducationPlatformProfileExtras(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<EducationPlatformProfileExtras | null> {
  const { data, error } = await supabase
    .from("education_platform_profile_extras")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getProfessionalProfileBundle(
  supabase: SupabaseClient<Database>,
  profile: Pick<UserProfile, "id" | "role" | "organization_type">,
) {
  const kind = resolveProfessionalProfileKind(profile);
  if (!kind) {
    return { kind: null, teacher: null, institution: null, platform: null };
  }

  if (kind === "teacher") {
    const teacher = await getTeacherProfileExtras(supabase, profile.id);
    return { kind, teacher, institution: null, platform: null };
  }

  if (kind === "institution") {
    const institution = await getInstitutionProfileExtras(supabase, profile.id);
    return { kind, teacher: null, institution, platform: null };
  }

  const platform = await getEducationPlatformProfileExtras(supabase, profile.id);
  return { kind, teacher: null, institution: null, platform };
}

export async function getTeacherCompletedLessonCount(
  supabase: SupabaseClient<Database>,
  teacherId: string,
): Promise<number> {
  const { data, error } = await supabase.rpc("get_teacher_completed_lesson_count", {
    target_teacher_id: teacherId,
  });

  if (error) throw error;
  return data ?? 0;
}

export async function getProfessionalProfilePortfolio(
  supabase: SupabaseClient<Database>,
  profile: Pick<UserProfile, "id" | "role" | "organization_type" | "is_verified">,
) {
  const bundle = await getProfessionalProfileBundle(supabase, profile);
  const [completedLessons, trust] = await Promise.all([
    profile.role === "teacher" ? getTeacherCompletedLessonCount(supabase, profile.id) : Promise.resolve(0),
    profile.role === "teacher"
      ? getTeacherProfessionalProfileBundle(supabase, profile.id)
      : Promise.resolve(null),
  ]);

  return { ...bundle, completedLessons, trust };
}

export async function upsertTeacherProfileExtras(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof upsertTeacherProfileExtrasSchema>,
) {
  const parsed = upsertTeacherProfileExtrasSchema.parse(input);
  const portfolioExtras = buildPortfolioRpcExtras(parsed);
  const { data, error } = await supabase.rpc("upsert_teacher_profile_extras", {
    next_cv_url: parsed.cvUrl ?? null,
    next_years_of_experience: parsed.yearsOfExperience,
    next_education_degree: parsed.educationDegree,
    next_teaching_style: parsed.teachingStyle,
    next_hourly_rate: parsed.hourlyRate,
    next_response_time_minutes: parsed.responseTimeMinutes,
    next_lesson_acceptance_rate_percent: parsed.lessonAcceptanceRatePercent,
    next_contact_summary: parsed.contactSummary ?? null,
    ...portfolioExtras,
  });

  if (error) throw error;
  return data;
}

export async function upsertInstitutionProfileExtras(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof upsertInstitutionProfileExtrasSchema>,
) {
  const parsed = upsertInstitutionProfileExtrasSchema.parse(input);
  const { data, error } = await supabase.rpc("upsert_institution_profile_extras", {
    next_license_number: parsed.licenseNumber,
    next_capacity: parsed.capacity,
    next_branch_count: parsed.branchCount,
    next_accreditation: parsed.accreditation,
    next_services: parsed.services,
    next_response_time_minutes: parsed.responseTimeMinutes,
    next_contact_summary: parsed.contactSummary ?? null,
    ...buildPortfolioRpcExtras(parsed),
  });

  if (error) throw error;
  return data;
}

export async function upsertEducationPlatformProfileExtras(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof upsertPlatformProfileExtrasSchema>,
) {
  const parsed = upsertPlatformProfileExtrasSchema.parse(input);
  const { data, error } = await supabase.rpc("upsert_education_platform_profile_extras", {
    next_content_count: parsed.contentCount,
    next_user_base_size: parsed.userBaseSize,
    next_subscription_model: parsed.subscriptionModel,
    next_integration_docs_url: parsed.integrationDocsUrl ?? null,
    next_response_time_minutes: parsed.responseTimeMinutes,
    next_contact_summary: parsed.contactSummary ?? null,
    ...buildPortfolioRpcExtras(parsed),
  });

  if (error) throw error;
  return data;
}

export function organizationBillingTierForType(organizationType: EducationOrganizationType | null) {
  return resolveOrganizationBillingTier(organizationType);
}
