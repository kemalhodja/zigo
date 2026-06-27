import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import {
  findPlanById,
  findPlanGroup,
  resolveSubscriptionPeriodEnd,
} from "@/lib/domain/subscription-plans";
import type {
  BankTransferRequestStatus,
  Database,
} from "@/lib/supabase/database.types";

export const reviewBankTransferSchema = z.object({
  requestId: z.string().uuid(),
  status: z.enum(["approved", "rejected", "cancelled"]),
  adminNote: z.string().trim().max(500).optional(),
});

export const createBankTransferSchema = z.object({
  planId: z.string().trim().min(3).max(80),
});

export type BankTransferConfig = {
  id: string;
  label: string | null;
  iban: string;
  accountName: string;
  bankName: string | null;
  branchName: string | null;
  accountNumber: string | null;
};

function normalizeIban(value: string) {
  return value.replaceAll(/\s+/g, "").toUpperCase();
}

function readBankAccountFromEnv(slot: 1 | 2): BankTransferConfig | null {
  const env = (key: string) => process.env[key]?.trim() || null;
  const ibanKey = slot === 1 ? "ZIGO_BANK_IBAN" : "ZIGO_BANK_2_IBAN";
  const nameKey = slot === 1 ? "ZIGO_BANK_ACCOUNT_NAME" : "ZIGO_BANK_2_ACCOUNT_NAME";
  const iban = env(ibanKey);
  const accountName = env(nameKey);
  if (!iban || !accountName) return null;

  const labelKey = slot === 1 ? "ZIGO_BANK_LABEL" : "ZIGO_BANK_2_LABEL";
  const bankNameKey = slot === 1 ? "ZIGO_BANK_NAME" : "ZIGO_BANK_2_NAME";
  const branchKey = slot === 1 ? "ZIGO_BANK_BRANCH" : "ZIGO_BANK_2_BRANCH";
  const accountNoKey = slot === 1 ? "ZIGO_BANK_ACCOUNT_NO" : "ZIGO_BANK_2_ACCOUNT_NO";

  return {
    id: slot === 1 ? "primary" : "secondary",
    label: env(labelKey),
    iban: normalizeIban(iban),
    accountName,
    bankName: env(bankNameKey),
    branchName: env(branchKey),
    accountNumber: env(accountNoKey),
  };
}

export function getBankTransferAccounts(): BankTransferConfig[] {
  return [readBankAccountFromEnv(1), readBankAccountFromEnv(2)].filter(
    (account): account is BankTransferConfig => account !== null,
  );
}

export function hasBankTransferConfigured() {
  return getBankTransferAccounts().length > 0;
}

export function getBankTransferConfig(): BankTransferConfig | null {
  return getBankTransferAccounts()[0] ?? null;
}

export function resolveBankTransferPlan(planId: string) {
  const group = findPlanGroup(planId);
  const plan = findPlanById(planId);
  if (!group || !plan) {
    throw new Error("Geçersiz abonelik planı.");
  }
  return { group, plan };
}

export async function createBankTransferRequest(
  supabase: SupabaseClient<Database>,
  planId: string,
) {
  const { plan } = resolveBankTransferPlan(planId);

  const { data, error } = await supabase.rpc("create_bank_transfer_request", {
    p_plan_id: planId,
    p_amount_try: plan.priceTry,
  });

  if (error) throw error;
  return data;
}

export async function attachBankTransferReceipt(
  supabase: SupabaseClient<Database>,
  requestId: string,
  receiptStoragePath: string,
) {
  const { data, error } = await supabase.rpc("attach_bank_transfer_receipt", {
    p_request_id: requestId,
    p_receipt_storage_path: receiptStoragePath,
  });

  if (error) throw error;
  return data;
}

export async function reviewBankTransferRequest(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof reviewBankTransferSchema>,
) {
  const parsed = reviewBankTransferSchema.parse(input);
  const periodEnd =
    parsed.status === "approved"
      ? resolveSubscriptionPeriodEnd(
          (await getBankTransferRequestById(supabase, parsed.requestId)).plan_id,
        )
      : null;

  const { data, error } = await supabase.rpc("review_bank_transfer_request", {
    p_request_id: parsed.requestId,
    p_status: parsed.status as BankTransferRequestStatus,
    p_admin_note: parsed.adminNote ?? null,
    p_period_end: periodEnd,
  });

  if (error) throw error;
  return data;
}

export async function getBankTransferRequestById(
  supabase: SupabaseClient<Database>,
  requestId: string,
) {
  const { data, error } = await supabase
    .from("bank_transfer_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Havale talebi bulunamadı.");
  return data;
}

export async function getPendingBankTransferQueue(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("bank_transfer_requests")
    .select(
      `
      *,
      user:user_id (
        full_name,
        email,
        role
      )
    `,
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getUserBankTransferRequests(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const { data, error } = await supabase
    .from("bank_transfer_requests")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) throw error;
  return data;
}
