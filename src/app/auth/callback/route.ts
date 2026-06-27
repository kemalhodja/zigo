import { NextResponse } from "next/server";

import { createAuthActionClient, persistRememberMePreference } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextParam = requestUrl.searchParams.get("next") ?? "/onboarding";
  const next = nextParam.startsWith("/") ? nextParam : "/onboarding";

  if (!code) {
    const authUrl = new URL("/auth", requestUrl.origin);
    authUrl.searchParams.set("error", "Doğrulama bağlantısı geçersiz veya süresi dolmuş.");
    return NextResponse.redirect(authUrl);
  }

  const supabase = await createAuthActionClient(true);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const authUrl = new URL("/auth", requestUrl.origin);
    authUrl.searchParams.set("error", getCallbackErrorMessage(error.message));
    return NextResponse.redirect(authUrl);
  }

  await persistRememberMePreference(true);
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}

function getCallbackErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("expired") || normalized.includes("invalid") || normalized.includes("code")) {
    return "Doğrulama bağlantısının süresi dolmuş. Tekrar kayıt ol veya doğrulama e-postasını yeniden gönder.";
  }

  if (normalized.includes("rate limit")) {
    return "Çok fazla deneme yapıldı. Bir süre bekleyip tekrar dene.";
  }

  return "E-posta doğrulaması tamamlanamadı. Tekrar dene.";
}
