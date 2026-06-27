import type { SupabaseClient } from "@supabase/supabase-js";

import { getUserInterestAreaIds } from "@/lib/domain/profiles";
import type { Database, UserRole } from "@/lib/supabase/database.types";

export type LessonRequestRow = Database["public"]["Tables"]["lesson_requests"]["Row"];
export type LessonRequestMessageRow = Database["public"]["Tables"]["lesson_request_messages"]["Row"];

export type LessonRequestListItem = Awaited<ReturnType<typeof getLessonRequestsForUser>>[number];

export type LessonRequestTeacherOption = {
  id: string;
  full_name: string;
  organization_type: string | null;
  shared_areas: string[];
};

export async function getLessonRequestsForUser(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from("lesson_requests")
    .select(
      `
      id,
      sender_id,
      receiver_id,
      child_profile_id,
      area_id,
      status,
      priority,
      message_body,
      created_at,
      updated_at,
      sender:sender_id ( full_name, role, organization_type, is_verified ),
      receiver:receiver_id ( full_name, role, organization_type, is_verified )
    `,
    )
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getLessonRequestById(supabase: SupabaseClient<Database>, requestId: string) {
  const { data, error } = await supabase
    .from("lesson_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getLessonRequestThread(
  supabase: SupabaseClient<Database>,
  requestId: string,
) {
  const { data, error } = await supabase
    .from("lesson_request_messages")
    .select(
      `
      id,
      request_id,
      sender_id,
      content,
      is_read,
      created_at,
      sender:sender_id ( full_name, role )
    `,
    )
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getVerifiedTeachersForParentLessonRequest(
  supabase: SupabaseClient<Database>,
  parentId: string,
) {
  const parentAreaIds = await getUserInterestAreaIds(supabase, parentId);
  if (parentAreaIds.length === 0) return [] as LessonRequestTeacherOption[];

  const { data: teacherInterests, error: interestError } = await supabase
    .from("user_interests")
    .select("user_id, area_id, education_areas(area_name)")
    .in("area_id", parentAreaIds);

  if (interestError) throw interestError;

  const teacherMap = new Map<string, Set<string>>();
  for (const row of teacherInterests ?? []) {
    const area = row.education_areas as { area_name?: string } | null;
    const areaName = area?.area_name ? String(area.area_name) : "";
    const current = teacherMap.get(row.user_id) ?? new Set<string>();
    if (areaName) current.add(areaName);
    teacherMap.set(row.user_id, current);
  }

  const teacherIds = [...teacherMap.keys()];
  if (teacherIds.length === 0) return [] as LessonRequestTeacherOption[];

  const { data: teachers, error: teacherError } = await supabase
    .from("users")
    .select("id, full_name, organization_type")
    .in("id", teacherIds)
    .eq("role", "teacher")
    .eq("is_verified", true)
    .order("full_name");

  if (teacherError) throw teacherError;

  return (teachers ?? []).map((teacher) => ({
    id: teacher.id,
    full_name: teacher.full_name,
    organization_type: teacher.organization_type,
    shared_areas: [...(teacherMap.get(teacher.id) ?? new Set<string>())],
  }));
}

export async function getLessonRequestUnreadCount(
  supabase: SupabaseClient<Database>,
  userId: string,
  role: UserRole,
) {
  if (role === "student") return 0;

  const { data, error } = await supabase.rpc("count_lesson_request_unread", {
    for_user_id: userId,
  });

  let count = error ? 0 : (data ?? 0);

  if (role === "parent") {
    const { count: pendingSent, error: pendingError } = await supabase
      .from("lesson_requests")
      .select("*", { count: "exact", head: true })
      .eq("sender_id", userId)
      .eq("status", "pending");

    if (!pendingError) {
      count += pendingSent ?? 0;
    }
  }

  if (error && role === "teacher") {
    const pending = await supabase
      .from("lesson_requests")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", userId)
      .eq("status", "pending");

    return pending.count ?? 0;
  }

  return count;
}

export async function markLessonRequestThreadRead(
  supabase: SupabaseClient<Database>,
  requestId: string,
  userId: string,
) {
  const { data, error } = await supabase.rpc("mark_lesson_request_thread_read", {
    target_request_id: requestId,
    for_user_id: userId,
  });

  if (error) throw error;
  return data ?? 0;
}

export async function getPendingLessonRequestCountForTeacher(
  supabase: SupabaseClient<Database>,
  teacherId: string,
) {
  const { count, error } = await supabase
    .from("lesson_requests")
    .select("*", { count: "exact", head: true })
    .eq("receiver_id", teacherId)
    .eq("status", "pending");

  if (error) return 0;
  return count ?? 0;
}
