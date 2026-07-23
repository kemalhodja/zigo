import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { createAuthActionClient, persistRememberMePreference } from "@/lib/supabase/server";

const ALLOWED_OTP_TYPES: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

function sanitizeNext(nextParam: string | null) {
  return nextParam?.startsWith("/") ? nextParam : "/onboarding";
}

function isEmailOtpType(value: string): value is EmailOtpType {
  return ALLOWED_OTP_TYPES.includes(value as EmailOtpType);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code")?.trim();
  const tokenHash = requestUrl.searchParams.get("token_hash")?.trim();
  const typeParam = requestUrl.searchParams.get("type")?.trim() ?? "";
  const next = sanitizeNext(requestUrl.searchParams.get("next"));

  // Hash-based implicit tokens never reach the server — hand off to the client bridge.
  if (!code && !tokenHash) {
    const bridge = new URL("/auth/session-bridge", requestUrl.origin);
    bridge.searchParams.set("next", next);
    return NextResponse.redirect(bridge);
  }

  const supabase = await createAuthActionClient(true);

  if (tokenHash && isEmailOtpType(typeParam)) {
    const { error } = await supabase.auth.verifyOtp({
      type: typeParam,
      token_hash: tokenHash,
    });

    if (error) {
      return redirectAuthError(requestUrl.origin, getCallbackErrorMessage(error.message, typeParam));
    }

    await persistRememberMePreference(true);
    const destination =
      typeParam === "recovery" && (next === "/onboarding" || !requestUrl.searchParams.get("next"))
        ? "/auth/reset-password"
        : next;
    return NextResponse.redirect(new URL(destination, requestUrl.origin));
  }

  if (!code) {
    return redirectAuthError(requestUrl.origin, "Doğrulama bağlantısı geçersiz veya süresi dolmuş.");
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return redirectAuthError(requestUrl.origin, getCallbackErrorMessage(error.message));
  }

  await persistRememberMePreference(true);
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}

function redirectAuthError(origin: string, message: string) {
  const authUrl = new URL("/auth", origin);
  authUrl.searchParams.set("error", message);
  return NextResponse.redirect(authUrl);
}

function getCallbackErrorMessage(message: string, type?: EmailOtpType) {
  const normalized = message.toLowerCase();

  if (normalized.includes("expired") || normalized.includes("invalid") || normalized.includes("code") || normalized.includes("otp")) {
    return type === "recovery"
      ? "Şifre sıfırlama bağlantısının süresi dolmuş. Yeni bağlantı iste."
      : "Doğrulama bağlantısının süresi dolmuş. Tekrar kayıt ol veya doğrulama e-postasını yeniden gönder.";
  }

  if (normalized.includes("rate limit")) {
    return "Çok fazla deneme yapıldı. Bir süre bekleyip tekrar dene.";
  }

  return type === "recovery"
    ? "Şifre sıfırlama tamamlanamadı. Yeni bağlantı iste."
    : "E-posta doğrulaması tamamlanamadı. Tekrar dene.";
}
