import { NextResponse } from "next/server";

import { createAuthActionClient, persistRememberMePreference } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const nextParam = requestUrl.searchParams.get("next") ?? "/onboarding";
  const isRecovery = type === "recovery" || nextParam.includes("reset-password");
  const next = isRecovery ? "/auth/reset-password" : nextParam.startsWith("/") ? nextParam : "/onboarding";

  // Handle direct OTP verification if token_hash is provided
  if (tokenHash && type === "recovery") {
    const supabase = await createAuthActionClient(true);
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
    if (!error) {
      await persistRememberMePreference(true);
      return NextResponse.redirect(new URL("/auth/reset-password", requestUrl.origin));
    }
  }

  // If no code is present on the server, check client-side hash before giving up
  if (!code) {
    const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>Zigo Yönlendirme</title>
</head>
<body style="font-family:system-ui,sans-serif;background:#f8fafc;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <p style="color:#64748b;font-weight:700;">Yönlendiriliyorsun…</p>
  <script>
    try {
      var hash = window.location.hash || "";
      if (hash && (hash.indexOf("type=recovery") !== -1 || hash.indexOf("access_token") !== -1)) {
        window.location.replace("/auth/reset-password" + hash);
      } else if (hash) {
        window.location.replace("/onboarding" + hash);
      } else {
        window.location.replace("/auth?error=" + encodeURIComponent("Doğrulama bağlantısı geçersiz veya süresi dolmuş."));
      }
    } catch(e) {
      window.location.replace("/auth");
    }
  </script>
</body>
</html>`;
    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const supabase = await createAuthActionClient(true);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const authUrl = new URL(isRecovery ? "/auth/forgot-password" : "/auth", requestUrl.origin);
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
