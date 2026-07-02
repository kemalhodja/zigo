import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export type StudyGroupRow = {
  id: string;
  name: string;
  description: string | null;
  area_id: number | null;
  owner_user_id: string;
  status: "pending_parent" | "active" | "closed";
  created_at: string;
};

export type StudyGroupMessageRow = {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: { full_name: string; role: string } | null;
};

export type StudyGroupApprovalRow = {
  id: string;
  kind: "create_group" | "join_group";
  status: "pending" | "approved" | "rejected";
  group_id: string;
  student_user_id: string;
  parent_user_id: string;
  note: string | null;
  created_at: string;
  group?: { name: string } | null;
  student?: { full_name: string; email: string } | null;
};

export async function listMyStudyGroups(supabase: SupabaseClient<Database>, userId: string) {
  const { data: memberships, error: memberError } = await supabase
    .from("study_group_members")
    .select("group_id")
    .eq("user_id", userId);

  if (memberError) throw memberError;

  const owned = await supabase
    .from("study_groups")
    .select("*")
    .eq("owner_user_id", userId)
    .order("created_at", { ascending: false });

  if (owned.error) throw owned.error;

  const memberGroupIds = (memberships ?? []).map((row) => row.group_id);
  const ownedIds = new Set((owned.data ?? []).map((group) => group.id));
  const extraIds = memberGroupIds.filter((id) => !ownedIds.has(id));

  if (extraIds.length === 0) {
    return (owned.data ?? []) as StudyGroupRow[];
  }

  const memberGroups = await supabase
    .from("study_groups")
    .select("*")
    .in("id", extraIds)
    .order("created_at", { ascending: false });

  if (memberGroups.error) throw memberGroups.error;

  const combined = [...(owned.data ?? []), ...(memberGroups.data ?? [])] as StudyGroupRow[];
  combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return combined;
}

export async function listActiveStudyGroupsForJoin(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("study_groups")
    .select("id, name, description, area_id, owner_user_id, status, created_at")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) throw error;
  return (data ?? []) as StudyGroupRow[];
}

export async function getStudyGroupMessages(supabase: SupabaseClient<Database>, groupId: string) {
  const { data, error } = await supabase
    .from("study_group_messages")
    .select(`
      id,
      group_id,
      sender_id,
      content,
      created_at,
      sender:sender_id ( full_name, role )
    `)
    .eq("group_id", groupId)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) throw error;
  return (data ?? []) as StudyGroupMessageRow[];
}

export async function getPendingStudyGroupApprovals(supabase: SupabaseClient<Database>, parentId: string) {
  const { data, error } = await supabase
    .from("study_group_approvals")
    .select(`
      id,
      kind,
      status,
      group_id,
      student_user_id,
      parent_user_id,
      note,
      created_at,
      group:group_id ( name ),
      student:student_user_id ( full_name, email )
    `)
    .eq("parent_user_id", parentId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as StudyGroupApprovalRow[];
}

export async function createStudyGroup(
  supabase: SupabaseClient<Database>,
  input: { name: string; description?: string; areaId?: number; parentEmail?: string },
) {
  const { data, error } = await supabase.rpc("create_study_group", {
    p_name: input.name,
    p_description: input.description ?? null,
    p_area_id: input.areaId ?? null,
    p_parent_email: input.parentEmail ?? null,
  });

  if (error) throw error;
  return data as StudyGroupRow;
}

export async function requestStudyGroupJoin(
  supabase: SupabaseClient<Database>,
  input: { groupId: string; parentEmail: string },
) {
  const { data, error } = await supabase.rpc("request_study_group_join", {
    p_group_id: input.groupId,
    p_parent_email: input.parentEmail,
  });

  if (error) throw error;
  return data;
}

export async function reviewStudyGroupApproval(
  supabase: SupabaseClient<Database>,
  input: { approvalId: string; decision: "approved" | "rejected" },
) {
  const { data, error } = await supabase.rpc("parent_review_study_group_approval", {
    p_approval_id: input.approvalId,
    p_decision: input.decision,
  });

  if (error) throw error;
  return data;
}

export async function sendStudyGroupMessage(
  supabase: SupabaseClient<Database>,
  input: { groupId: string; content: string },
) {
  const { data, error } = await supabase.rpc("send_study_group_message", {
    p_group_id: input.groupId,
    p_content: input.content,
  });

  if (error) throw error;
  return data;
}

export async function completeRoleSelection(
  supabase: SupabaseClient<Database>,
  input: { role: "teacher" | "parent" | "student" | "platform"; organizationType?: string | null },
) {
  const { data, error } = await supabase.rpc("complete_role_selection", {
    profile_role: input.role,
    org_type: input.organizationType ?? null,
  });

  if (error) throw error;
  return data;
}
