import type { SupabaseClient } from "@supabase/supabase-js";

import { getSiteUrl } from "@/lib/domain/deploy-config";
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
) {
  const { data, error } = await admin.from("users").select("id").eq("email", email).maybeSingle();
  if (error) throw error;
  return data;
}

export function hasDirectRecoveryEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export async function requestPasswordReset(params: {
  admin: SupabaseClient<Database>;
  anon: SupabaseClient<Database>;
  email: string;
  requestOrigin?: string;
}): Promise<PasswordResetResult> {
  const siteUrl = getSiteUrl(params.requestOrigin);
  const profile = await findRegisteredUserByEmail(params.admin, params.email);
  if (!profile) {
    return { ok: false, code: "ACCOUNT_NOT_FOUND" };
  }

  if (hasDirectRecoveryEmailConfigured()) {
    const { data, error } = await params.admin.auth.admin.generateLink({
      type: "recovery",
      email: params.email,
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

  const { error } = await params.anon.auth.resetPasswordForEmail(params.email, {
    redirectTo: new URL("/auth/callback?next=/auth/reset-password", siteUrl).toString(),
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
