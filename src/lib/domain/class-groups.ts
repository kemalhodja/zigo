import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { ClassGroupRow, Database } from "@/lib/supabase/database.types";

export const joinClassGroupSchema = z.object({
  city: z.string().trim().min(2, "İl adı en az 2 karakter olmalıdır"),
  district: z.string().trim().min(2, "İlçe adı en az 2 karakter olmalıdır"),
  schoolName: z.string().trim().min(3, "Okul adı en az 3 karakter olmalıdır"),
  gradeLevel: z.string().trim().min(1, "Sınıf seviyesi seçilmelidir"),
  classroom: z.string().trim().optional().default(""),
  childProfileId: z.string().uuid().optional().nullable(),
});

export const leaveClassGroupSchema = z.object({
  groupId: z.string().uuid(),
  childProfileId: z.string().uuid().optional().nullable(),
});

export type ClassGroupInfo = {
  group: ClassGroupRow | null;
  memberCount: number;
  isJoined: boolean;
  userLocation: {
    city: string | null;
    district: string | null;
    schoolName: string | null;
    gradeLevel: string | null;
    classroom: string | null;
  };
};

export async function getClassGroupInfo(
  supabase: SupabaseClient<Database>,
  userId: string,
  childProfileId?: string | null,
): Promise<ClassGroupInfo> {
  let location = {
    city: null as string | null,
    district: null as string | null,
    schoolName: null as string | null,
    gradeLevel: null as string | null,
    classroom: null as string | null,
  };

  if (childProfileId) {
    const { data: child } = await supabase
      .from("child_profiles")
      .select("city, district, school_name, grade_level, classroom")
      .eq("id", childProfileId)
      .eq("parent_id", userId)
      .maybeSingle();

    if (child) {
      location = {
        city: child.city,
        district: child.district,
        schoolName: child.school_name,
        gradeLevel: child.grade_level,
        classroom: child.classroom,
      };
    }
  } else {
    const { data: user } = await supabase
      .from("users")
      .select("city, district, school_name, grade_level, classroom")
      .eq("id", userId)
      .maybeSingle();

    if (user) {
      const u = user as unknown as {
        city: string | null;
        district: string | null;
        school_name: string | null;
        grade_level: string | null;
        classroom: string | null;
      };
      location = {
        city: u.city,
        district: u.district,
        schoolName: u.school_name,
        gradeLevel: u.grade_level,
        classroom: u.classroom,
      };
    }
  }

  if (!location.city || !location.district || !location.schoolName || !location.gradeLevel) {
    return {
      group: null,
      memberCount: 0,
      isJoined: false,
      userLocation: location,
    };
  }

  const { data: group } = await supabase
    .from("class_groups")
    .select("*")
    .eq("city", location.city)
    .eq("district", location.district)
    .eq("school_name", location.schoolName)
    .eq("grade_level", location.gradeLevel)
    .eq("classroom", location.classroom || "")
    .maybeSingle();

  if (!group) {
    return {
      group: null,
      memberCount: 0,
      isJoined: false,
      userLocation: location,
    };
  }

  const { count } = await supabase
    .from("class_group_members")
    .select("id", { count: "exact", head: true })
    .eq("group_id", group.id);

  let isJoined = false;
  if (childProfileId) {
    const { data: member } = await supabase
      .from("class_group_members")
      .select("id")
      .eq("group_id", group.id)
      .eq("child_profile_id", childProfileId)
      .maybeSingle();
    isJoined = Boolean(member);
  } else {
    const { data: member } = await supabase
      .from("class_group_members")
      .select("id")
      .eq("group_id", group.id)
      .eq("user_id", userId)
      .maybeSingle();
    isJoined = Boolean(member);
  }

  return {
    group,
    memberCount: count ?? 0,
    isJoined,
    userLocation: location,
  };
}

export async function joinClassGroup(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof joinClassGroupSchema>,
) {
  const parsed = joinClassGroupSchema.parse(input);

  const { data, error } = await supabase.rpc("join_class_group", {
    p_city: parsed.city,
    p_district: parsed.district,
    p_school_name: parsed.schoolName,
    p_grade_level: parsed.gradeLevel,
    p_classroom: parsed.classroom,
    p_child_profile_id: parsed.childProfileId ?? undefined,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function leaveClassGroup(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof leaveClassGroupSchema>,
) {
  const parsed = leaveClassGroupSchema.parse(input);

  const { data, error } = await supabase.rpc("leave_class_group", {
    p_group_id: parsed.groupId,
    p_child_profile_id: parsed.childProfileId ?? undefined,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
