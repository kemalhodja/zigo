import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import {
  type EducationOrganizationType,
  isEducationOrganizationType,
} from "@/lib/domain/education-organization";
import { updateGradeLevelSchema, isAutoInterestGradeLevel, resolveAutoInterestAreaIds } from "@/lib/domain/grade-level";
import { assertModeratedOptionalText } from "@/lib/domain/moderation";
import {
  REGISTRATION_ACCOUNT_KIND_VALUES,
  type RegistrationAccountKind,
  resolveRegistrationAccount,
} from "@/lib/domain/registration-account";
import type { Database, UserRole } from "@/lib/supabase/database.types";

export type UserProfile = Database["public"]["Tables"]["users"]["Row"];

export const createProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  role: z.enum(["teacher", "parent", "student"]).optional(),
  accountKind: z.enum(REGISTRATION_ACCOUNT_KIND_VALUES).optional(),
  city: z.string().trim().optional(),
}).refine((value) => Boolean(value.role || value.accountKind), {
  message: "Choose student, parent, teacher, kurs, okul, institution, platform or publisher.",
});

export const setInterestsSchema = z.object({
  areaIds: z.array(z.coerce.number().int().positive()).min(1).max(50),
  organizationType: z
    .enum(["kurs", "okul", "egitim_kurumu", "egitim_platformu", "yayinevi"])
    .optional(),
});

export const setOrganizationTypeSchema = z.object({
  organizationType: z.enum(["kurs", "okul", "egitim_kurumu", "egitim_platformu", "yayinevi"]),
});

export const updateUserProfileSchema = z
  .object({
    fullName: z.string().trim().min(2).max(100).optional(),
    bio: z.string().trim().max(500).optional(),
    avatarUrl: z.string().trim().max(250000).optional().nullable(),
    coverUrl: z.string().trim().max(250000).optional().nullable(),
  })
  .refine(
    (value) =>
      value.fullName !== undefined ||
      value.bio !== undefined ||
      value.avatarUrl !== undefined ||
      value.coverUrl !== undefined,
    {
      message: "Provide fullName, bio, avatarUrl or coverUrl to update.",
    },
  );

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
  input: { fullName: string; role?: UserRole; accountKind?: RegistrationAccountKind; city?: string },
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

  // Update city if provided
  if (parsed.city?.trim()) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("users").update({ city: parsed.city.trim() } as any).eq("id", user.id);
    }
  }

  if (account.organizationType) {
    await setUserOrganizationType(supabase, account.organizationType);
  }

  const refreshed = await getCurrentProfile(supabase);
  return refreshed ?? data;
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
    ...(parsed.fullName !== undefined ? { next_full_name: parsed.fullName } : {}),
  });

  if (error) throw error;

  if (parsed.coverUrl !== undefined) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("users").update({ cover_url: parsed.coverUrl } as any).eq("id", user.id);
    }
  }

  return data;
}

export const updateAccountKindSchema = z.object({
  accountKind: z.enum(REGISTRATION_ACCOUNT_KIND_VALUES),
});

export async function updateOwnAccountKind(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof updateAccountKindSchema>,
) {
  const parsed = updateAccountKindSchema.parse(input);
  const account = resolveRegistrationAccount(parsed.accountKind);

  const { data, error } = await supabase.rpc("update_own_account_kind", {
    next_role: account.role,
    next_organization_type: account.organizationType,
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

export async function applyAutoInterestsForGrade(
  supabase: SupabaseClient<Database>,
  gradeLevel: string,
) {
  if (!isAutoInterestGradeLevel(gradeLevel)) {
    return { autoAssigned: false as const, areaIds: [] as number[] };
  }

  const areas = await getEducationAreas(supabase);
  const areaIds = resolveAutoInterestAreaIds(areas, gradeLevel);
  if (areaIds.length === 0) {
    return { autoAssigned: false as const, areaIds: [] as number[] };
  }

  await setUserInterests(supabase, { areaIds });
  return { autoAssigned: true as const, areaIds };
}
