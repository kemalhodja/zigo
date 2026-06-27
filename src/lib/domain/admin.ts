import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database, StoreRedemptionStatus, StudentDocumentStatus } from "@/lib/supabase/database.types";

export const verifyTeacherSchema = z.object({
  teacherId: z.string().uuid(),
  verified: z.boolean(),
});

export const updateRedemptionStatusSchema = z.object({
  redemptionId: z.string().uuid(),
  status: z.enum(["pending_parent_approval", "approved", "fulfilled", "cancelled"]),
});

export const updateProductStockSchema = z.object({
  productId: z.string().uuid(),
  stockCount: z.coerce.number().int().min(0),
});

export const setTeacherAreasSchema = z.object({
  teacherId: z.string().uuid(),
  areaIds: z.array(z.coerce.number().int().positive()).min(1).max(20),
});

export const reviewStudentDocumentSchema = z.object({
  studentId: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
});

export const reviewTeacherCredentialSchema = z.object({
  submissionId: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
  adminNote: z.string().trim().max(500).optional(),
});

export const resolvePaymentDisputeSchema = z.object({
  disputeId: z.string().uuid(),
  status: z.enum(["reviewing", "resolved_parent", "resolved_teacher", "closed"]),
  resolutionNote: z.string().trim().max(2000).optional(),
});

export type TeacherCredentialQueueItem = Database["public"]["Tables"]["teacher_credential_submissions"]["Row"] & {
  teacher: { full_name: string; email: string; is_verified: boolean } | null;
};

export type PaymentDisputeQueueItem = Database["public"]["Tables"]["payment_disputes"]["Row"] & {
  booking: {
    id: string;
    start_time: string;
    parent_id: string;
    teacher_id: string;
    parent: { full_name: string; email: string } | null;
    teacher: { full_name: string; email: string } | null;
  } | null;
};

export async function isCurrentUserPlatformAdmin(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase.rpc("current_user_is_platform_admin");

  if (error) throw error;
  return data;
}

export async function getTeacherVerificationQueue(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("role", "teacher")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getAdminStoreProducts(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("store_products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getAdminStoreRedemptions(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("store_redemptions")
    .select(
      `
      *,
      product:product_id (
        name,
        category,
        price_points
      ),
      user:user_id (
        full_name,
        email
      ),
      child:child_profile_id (
        display_name,
        age_group,
        parent:parent_id (
          full_name,
          email
        )
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function verifyTeacher(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof verifyTeacherSchema>,
) {
  const parsed = verifyTeacherSchema.parse(input);

  const { data, error } = await supabase.rpc("verify_teacher", {
    target_teacher_id: parsed.teacherId,
    verified: parsed.verified,
  });

  if (error) throw error;
  return data;
}

export async function setTeacherAreas(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof setTeacherAreasSchema>,
) {
  const parsed = setTeacherAreasSchema.parse(input);
  const uniqueAreaIds = [...new Set(parsed.areaIds)];
  const { error } = await supabase.rpc("admin_set_teacher_areas", {
    target_teacher_id: parsed.teacherId,
    area_ids: uniqueAreaIds,
  });

  if (error) throw error;
}

export async function updateStoreRedemptionStatus(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof updateRedemptionStatusSchema>,
) {
  const parsed = updateRedemptionStatusSchema.parse(input);

  const { data, error } = await supabase.rpc("update_store_redemption_status", {
    target_redemption_id: parsed.redemptionId,
    next_status: parsed.status as StoreRedemptionStatus,
  });

  if (error) throw error;
  return data;
}

export async function updateStoreProductStock(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof updateProductStockSchema>,
) {
  const parsed = updateProductStockSchema.parse(input);

  const { data, error } = await supabase.rpc("update_store_product_stock", {
    target_product_id: parsed.productId,
    next_stock_count: parsed.stockCount,
  });

  if (error) throw error;
  return data;
}

export async function getStudentDocumentQueue(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("role", "student")
    .eq("student_document_status", "pending")
    .not("student_document_url", "is", null)
    .order("student_document_submitted_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function reviewStudentDocument(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof reviewStudentDocumentSchema>,
) {
  const parsed = reviewStudentDocumentSchema.parse(input);

  const { data, error } = await supabase.rpc("review_student_document", {
    target_student_id: parsed.studentId,
    next_status: parsed.status as StudentDocumentStatus,
  });

  if (error) throw error;
  return data;
}

export async function getTeacherCredentialQueue(
  supabase: SupabaseClient<Database>,
): Promise<TeacherCredentialQueueItem[]> {
  const { data, error } = await supabase
    .from("teacher_credential_submissions")
    .select(
      `
      *,
      teacher:teacher_id (
        full_name,
        email,
        is_verified
      )
    `,
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as TeacherCredentialQueueItem[];
}

export async function getOpenPaymentDisputeQueue(
  supabase: SupabaseClient<Database>,
): Promise<PaymentDisputeQueueItem[]> {
  const { data, error } = await supabase
    .from("payment_disputes")
    .select(
      `
      *,
      booking:booking_id (
        id,
        start_time,
        parent_id,
        teacher_id,
        parent:parent_id ( full_name, email ),
        teacher:teacher_id ( full_name, email )
      )
    `,
    )
    .in("status", ["open", "reviewing"])
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as PaymentDisputeQueueItem[];
}

export async function reviewTeacherCredential(
  supabase: SupabaseClient<Database>,
  adminId: string,
  input: z.infer<typeof reviewTeacherCredentialSchema>,
) {
  const parsed = reviewTeacherCredentialSchema.parse(input);
  const now = new Date().toISOString();

  const { data: submission, error: fetchError } = await supabase
    .from("teacher_credential_submissions")
    .select("id, teacher_id, status")
    .eq("id", parsed.submissionId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!submission) throw new Error("Credential submission not found.");

  const { data, error } = await supabase
    .from("teacher_credential_submissions")
    .update({
      status: parsed.status,
      admin_note: parsed.adminNote ?? null,
      reviewed_by: adminId,
      reviewed_at: now,
    })
    .eq("id", parsed.submissionId)
    .select("*")
    .single();

  if (error) throw error;

  if (parsed.status === "approved") {
    await supabase.rpc("verify_teacher", {
      target_teacher_id: submission.teacher_id,
      verified: true,
    });
  }

  return data;
}

export async function resolvePaymentDispute(
  supabase: SupabaseClient<Database>,
  adminId: string,
  input: z.infer<typeof resolvePaymentDisputeSchema>,
) {
  const parsed = resolvePaymentDisputeSchema.parse(input);

  const { data, error } = await supabase
    .from("payment_disputes")
    .update({
      status: parsed.status,
      resolution_note: parsed.resolutionNote ?? null,
      resolved_by: adminId,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", parsed.disputeId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
