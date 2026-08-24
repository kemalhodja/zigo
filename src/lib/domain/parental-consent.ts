import { createHash, randomBytes } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/lib/supabase/database.types";

export const MINOR_AGE_LIMIT = 15;

export const parentalConsentEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Geçerli bir veli e-postası girin.")
  .max(200);

export function hashConsentToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function generateConsentToken(): string {
  return randomBytes(32).toString("hex");
}

export function calculateAgeFromBirthYear(birthYear: number, now = new Date()): number {
  return now.getUTCFullYear() - birthYear;
}

export function isMinorBirthYear(birthYear: number, now = new Date()): boolean {
  if (!Number.isInteger(birthYear)) return false;
  const currentYear = now.getUTCFullYear();
  if (birthYear < currentYear - 100 || birthYear > currentYear) return false;
  return calculateAgeFromBirthYear(birthYear, now) < MINOR_AGE_LIMIT;
}

export type ConsentRequestResult =
  | { ok: true; token: string; parentEmail: string }
  | { ok: false; error: string };

/**
 * Creates (or replaces) a pending parental consent request for a student.
 * Requires a service-role client — the table is RLS-locked to owner selects.
 */
export async function createParentalConsentRequest(
  admin: SupabaseClient<Database>,
  studentUserId: string,
  rawParentEmail: string,
): Promise<ConsentRequestResult> {
  const parsed = parentalConsentEmailSchema.safeParse(rawParentEmail);
  if (!parsed.success) {
    return { ok: false, error: "Geçerli bir veli e-postası girin." };
  }
  const parentEmail = parsed.data;
  const token = generateConsentToken();
  const tokenHash = hashConsentToken(token);

  await admin
    .from("parental_consents")
    .delete()
    .eq("student_user_id", studentUserId)
    .eq("status", "pending");

  const { error } = await admin.from("parental_consents").insert({
    student_user_id: studentUserId,
    parent_email: parentEmail,
    token_hash: tokenHash,
    status: "pending",
  });

  if (error) {
    return { ok: false, error: "Onam kaydı oluşturulamadı." };
  }

  return { ok: true, token, parentEmail };
}

export type ConsentDecision = "approved" | "rejected";

export type ConsentDecisionResult =
  | { ok: true; status: ConsentDecision }
  | { ok: false; error: string };

/**
 * Approves or rejects a pending consent by its raw token (parent flow).
 * Public — the token acts as a capability; only its hash is stored.
 */
export async function decideParentalConsent(
  admin: SupabaseClient<Database>,
  rawToken: string,
  decision: ConsentDecision,
): Promise<ConsentDecisionResult> {
  const token = rawToken.trim();
  if (!/^[0-9a-f]{64}$/.test(token)) {
    return { ok: false, error: "Geçersiz onam bağlantısı." };
  }

  const { data, error } = await admin
    .from("parental_consents")
    .update({ status: decision, decided_at: new Date().toISOString() })
    .eq("token_hash", hashConsentToken(token))
    .eq("status", "pending")
    .select("status")
    .maybeSingle();

  if (error) {
    return { ok: false, error: "Onam kararı kaydedilemedi." };
  }
  if (!data) {
    return { ok: false, error: "Onam kaydı bulunamadı ya da zaten sonuçlanmış." };
  }

  return { ok: true, status: data.status as ConsentDecision };
}

export type ParentalConsentStatus = "none" | "pending" | "approved" | "rejected";

/** Reads the latest consent state for the signed-in student (RLS-safe client). */
export async function getParentalConsentStatus(
  supabase: SupabaseClient<Database>,
  studentUserId: string,
): Promise<ParentalConsentStatus> {
  const { data } = await supabase
    .from("parental_consents")
    .select("status")
    .eq("student_user_id", studentUserId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data?.status) return "none";
  return data.status as ParentalConsentStatus;
}
