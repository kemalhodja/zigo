import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import {
  type EducationOrganizationType,
  isEducationOrganizationType,
} from "@/lib/domain/education-organization";
import { updateGradeLevelSchema } from "@/lib/domain/grade-level";
import { assertModeratedOptionalText } from "@/lib/domain/moderation";
import {
  type RegistrationAccountKind,
  resolveRegistrationAccount,
} from "@/lib/domain/registration-account";
import type { Database, UserRole } from "@/lib/supabase/database.types";

export type UserProfile = Database["public"]["Tables"]["users"]["Row"];

export const createProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  role: z.enum(["teacher", "parent", "student"]).optional(),
  accountKind: z.enum(["student", "parent", "teacher", "institution", "platform"]).optional(),
}).refine((value) => Boolean(value.role || value.accountKind), {
  message: "Choose student, parent, teacher, institution or platform.",
});

export const setInterestsSchema = z.object({
  areaIds: z.array(z.coerce.number().int().positive()).min(1).max(20),
  organizationType: z
    .enum(["kurs", "okul", "egitim_kurumu", "egitim_platformu"])
    .optional(),
});

export const setOrganizationTypeSchema = z.object({
  organizationType: z.enum(["kurs", "okul", "egitim_kurumu", "egitim_platformu"]),
});

export const updateUserProfileSchema = z
  .object({
    bio: z.string().trim().max(500).optional(),
    avatarUrl: z.string().trim().url().max(500).optional(),
  })
  .refine((value) => value.bio !== undefined || value.avatarUrl !== undefined, {
    message: "Provide bio or avatarUrl to update.",
  });

export const submitStudentDocumentSchema = z.object({
  documentUrl: z.string().trim().url().max(500),
});

export function isStudentDocumentApproved(profile: Pick<UserProfile, "role" | "student_document_status">) {
  return profile.role !== "student" || profile.student_document_status === "approved";
}

export async function getCurrentProfile(supabase: SupabaseClient<Database>) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user) return null;
  if (authError) throw authError;

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createProfile(
  supabase: SupabaseClient<Database>,
  input: { fullName: string; role?: UserRole; accountKind?: RegistrationAccountKind },
) {
  const parsed = createProfileSchema.parse(input);
  const account = parsed.accountKind
    ? resolveRegistrationAccount(parsed.accountKind)
    : {
        role: parsed.role!,
        organizationType: null as EducationOrganizationType | null,
      };

  const { data, error } = await supabase.rpc("create_profile", {
    full_name: parsed.fullName,
    profile_role: account.role,
  });

  if (error) throw error;

  if (account.organizationType) {
    await setUserOrganizationType(supabase, account.organizationType);
    const refreshed = await getCurrentProfile(supabase);
    return refreshed ?? data;
  }

  return data;
}

export async function getEducationAreas(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("education_areas")
    .select("*")
    .order("area_name");

  if (error) throw error;
  return data;
}

export async function getUserInterestAreaIds(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const { data, error } = await supabase
    .from("user_interests")
    .select("area_id")
    .eq("user_id", userId);

  if (error) throw error;
  return data.map((interest) => interest.area_id);
}

export async function getUserInterestAreaNames(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const areaIds = await getUserInterestAreaIds(supabase, userId);
  if (areaIds.length === 0) return [];

  const { data, error } = await supabase
    .from("education_areas")
    .select("area_name")
    .in("id", areaIds)
    .order("area_name");

  if (error) throw error;
  return data.map((area) => area.area_name);
}

export async function setUserInterests(
  supabase: SupabaseClient<Database>,
  input: { areaIds: number[]; organizationType?: EducationOrganizationType },
) {
  const parsed = setInterestsSchema.parse(input);
  const uniqueAreaIds = [...new Set(parsed.areaIds)];

  const { error } = await supabase.rpc("set_user_interests", {
    area_ids: uniqueAreaIds,
  });

  if (error) throw error;

  if (parsed.organizationType) {
    await setUserOrganizationType(supabase, parsed.organizationType);
  }
}

export async function setUserOrganizationType(
  supabase: SupabaseClient<Database>,
  organizationType: EducationOrganizationType,
) {
  const parsed = setOrganizationTypeSchema.parse({ organizationType });
  const { error } = await supabase.rpc("set_user_organization_type", {
    target_type: parsed.organizationType,
  });
  if (error) throw error;
}

export function parseOrganizationType(value: string | null | undefined): EducationOrganizationType | null {
  return isEducationOrganizationType(value) ? value : null;
}

export async function updateUserProfile(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof updateUserProfileSchema>,
) {
  const parsed = updateUserProfileSchema.parse(input);
  const safeBio = parsed.bio !== undefined ? assertModeratedOptionalText(parsed.bio) : undefined;

  const { data, error } = await supabase.rpc("update_user_profile", {
    ...(safeBio !== undefined ? { next_bio: safeBio } : {}),
    ...(parsed.avatarUrl !== undefined ? { next_avatar_url: parsed.avatarUrl } : {}),
  });

  if (error) throw error;
  return data;
}

export async function submitStudentDocument(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof submitStudentDocumentSchema>,
) {
  const parsed = submitStudentDocumentSchema.parse(input);

  const { data, error } = await supabase.rpc("submit_student_document", {
    document_url: parsed.documentUrl,
  });

  if (error) throw error;
  return data;
}

export async function updateUserGradeLevel(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof updateGradeLevelSchema>,
) {
  const parsed = updateGradeLevelSchema.parse(input);

  const { data, error } = await supabase.rpc("update_user_grade_level", {
    next_grade_level: parsed.gradeLevel,
  });

  if (error) throw error;
  return data;
}
