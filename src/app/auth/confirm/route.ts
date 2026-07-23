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
  const tokenHash = requestUrl.searchParams.get("token_hash")?.trim();
  const typeParam = requestUrl.searchParams.get("type")?.trim() ?? "";
  const next = sanitizeNext(requestUrl.searchParams.get("next"));

  if (!tokenHash || !isEmailOtpType(typeParam)) {
    const authUrl = new URL("/auth", requestUrl.origin);
    authUrl.searchParams.set("error", "Doğrulama bağlantısı geçersiz veya süresi dolmuş.");
    return NextResponse.redirect(authUrl);
  }

  const supabase = await createAuthActionClient(true);
  const { error } = await supabase.auth.verifyOtp({
    type: typeParam,
    token_hash: tokenHash,
  });

  if (error) {
    const authUrl = new URL("/auth", requestUrl.origin);
    authUrl.searchParams.set("error", getConfirmErrorMessage(error.message, typeParam));
    return NextResponse.redirect(authUrl);
  }

  await persistRememberMePreference(true);

  const destination =
    typeParam === "recovery" && next === "/onboarding" ? "/auth/reset-password" : next;

  return NextResponse.redirect(new URL(destination, requestUrl.origin));
}

function getConfirmErrorMessage(message: string, type: EmailOtpType) {
  const normalized = message.toLowerCase();

  if (normalized.includes("expired") || normalized.includes("invalid") || normalized.includes("otp")) {
    return type === "recovery"
      ? "Şifre sıfırlama bağlantısının süresi dolmuş. Yeni bağlantı iste."
      : "Doğrulama bağlantısının süresi dolmuş. Tekrar dene.";
  }

  if (normalized.includes("rate limit")) {
    return "Çok fazla deneme yapıldı. Bir süre bekleyip tekrar dene.";
  }

  return type === "recovery"
    ? "Şifre sıfırlama tamamlanamadı. Yeni bağlantı iste."
    : "E-posta doğrulaması tamamlanamadı. Tekrar dene.";
}
