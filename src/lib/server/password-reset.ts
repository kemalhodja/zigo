import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSiteUrl, isLocalSiteUrl } from "@/lib/domain/deploy-config";
import { buildRecoveryUrl, sendRecoveryEmail } from "@/lib/server/recovery-email";
import type { Database } from "@/lib/supabase/database.types";

export const FORGOT_PASSWORD_SUCCESS =
  "Şifre sıfırlama bağlantısı e-posta adresine gönderildi. Gelen kutunu ve spam klasörünü kontrol et.";

export const FORGOT_PASSWORD_ACCOUNT_NOT_FOUND = "Bu e-posta ile kayıtlı hesap bulunamadı.";

export const FORGOT_PASSWORD_SEND_FAILED =
  "Sıfırlama e-postası gönderilemedi. Lütfen birkaç dakika sonra tekrar dene.";

export const FORGOT_PASSWORD_RATE_LIMIT = "Çok sık denedin. Birkaç dakika sonra tekrar dene.";

export type PasswordResetResult =
  | { ok: true }
  | { ok: false; code: "ACCOUNT_NOT_FOUND" | "SEND_FAILED" | "RATE_LIMITED" | "UNCONFIGURED" };

function isUserNotFoundMessage(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("user not found") || normalized.includes("not found");
}

function isRateLimitMessage(message: string, status?: number) {
  const normalized = message.toLowerCase();
  return status === 429 || normalized.includes("rate limit") || normalized.includes("too many");
}

export async function findRegisteredUserByEmail(
  admin: SupabaseClient<Database>,
  email: string,
): Promise<{ id: string; email?: string } | null> {
  const cleanEmail = email.trim().toLowerCase();
  const { data, error } = await admin.from("users").select("id, email").eq("email", cleanEmail).maybeSingle();
  if (error) throw error;
  if (data) return data;

  // Fallback for masked multi-role emails (+student, +teacher, +parent)
  const parts = cleanEmail.split("@");
  if (parts.length === 2 && !parts[0].includes("+")) {
    for (const suffix of ["student", "teacher", "parent"]) {
      const masked = `${parts[0]}+${suffix}@${parts[1]}`;
      const { data: maskedRow } = await admin.from("users").select("id, email").eq("email", masked).maybeSingle();
      if (maskedRow) return maskedRow;
    }
  }

  return null;
}

export function hasDirectRecoveryEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function resolveRecoverySiteUrl(requestOrigin?: string): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured && !isLocalSiteUrl(configured)) {
    return configured.replace(/\/$/, "");
  }

  if (requestOrigin) {
    try {
      const parsed = new URL(requestOrigin);
      if (!parsed.protocol.startsWith("capacitor") && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
        return requestOrigin.replace(/\/$/, "");
      }
    } catch {
      // ignore
    }
  }

  return getSiteUrl(requestOrigin || "http://localhost:3000");
}

function createImplicitResetClient(fallbackClient: SupabaseClient<Database>): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!supabaseUrl || !supabaseAnonKey) {
    return fallbackClient;
  }

  // Use implicit flow when requesting a password reset from a server route handler
  // so the email link works across any mail app, device, or browser without requiring
  // a server-generated PKCE code_verifier cookie.
  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: "implicit",
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function requestPasswordReset(params: {
  admin: SupabaseClient<Database>;
  anon: SupabaseClient<Database>;
  email: string;
  requestOrigin?: string;
}): Promise<PasswordResetResult> {
  const siteUrl = resolveRecoverySiteUrl(params.requestOrigin);
  const profile = await findRegisteredUserByEmail(params.admin, params.email);
  if (!profile) {
    return { ok: false, code: "ACCOUNT_NOT_FOUND" };
  }

  const targetEmail = profile.email || params.email;

  if (hasDirectRecoveryEmailConfigured()) {
    const { data, error } = await params.admin.auth.admin.generateLink({
      type: "recovery",
      email: targetEmail,
      options: {
        redirectTo: new URL("/auth/reset-password", siteUrl).toString(),
      },
    });

    if (error) {
      if (isUserNotFoundMessage(error.message)) {
        return { ok: false, code: "ACCOUNT_NOT_FOUND" };
      }
      if (isRateLimitMessage(error.message, error.status)) {
        return { ok: false, code: "RATE_LIMITED" };
      }
      throw error;
    }

    const tokenHash = data.properties?.hashed_token;
    if (!tokenHash) {
      return { ok: false, code: "SEND_FAILED" };
    }

    try {
      await sendRecoveryEmail({
        to: params.email,
        recoveryUrl: buildRecoveryUrl(tokenHash, siteUrl),
        siteUrl,
      });
      return { ok: true };
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : "";
      if (isRateLimitMessage(message)) {
        return { ok: false, code: "RATE_LIMITED" };
      }
      return { ok: false, code: "SEND_FAILED" };
    }
  }

  const resetClient = createImplicitResetClient(params.anon);
  const { error } = await resetClient.auth.resetPasswordForEmail(targetEmail, {
    redirectTo: new URL("/auth/reset-password", siteUrl).toString(),
  });

  if (error) {
    if (isRateLimitMessage(error.message, error.status)) {
      return { ok: false, code: "RATE_LIMITED" };
    }
    if (isUserNotFoundMessage(error.message)) {
      return { ok: false, code: "ACCOUNT_NOT_FOUND" };
    }
    return { ok: false, code: "SEND_FAILED" };
  }

  return { ok: true };
}
