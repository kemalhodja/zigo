import { getAuthRedirectSiteUrl, getSiteUrl } from "@/lib/domain/deploy-config";

type RecoveryEmailInput = {
  to: string;
  recoveryUrl: string;
  siteUrl?: string;
};

const RECOVERY_SUBJECT = "Zigo şifre sıfırlama";

export function buildRecoveryEmailHtml(recoveryUrl: string, siteUrl: string) {
  return `<!DOCTYPE html>
<html lang="tr">
  <body style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
    <h2 style="margin:0 0 12px">Zigo şifre sıfırlama</h2>
    <p>Hesabın için yeni bir şifre belirlemek üzere aşağıdaki bağlantıya tıkla:</p>
    <p><a href="${recoveryUrl}" style="display:inline-block;padding:12px 18px;background:#6d28d9;color:#fff;text-decoration:none;border-radius:8px;font-weight:700">Şifremi sıfırla</a></p>
    <p style="word-break:break-all;font-size:12px;color:#64748b">${recoveryUrl}</p>
    <p style="font-size:12px;color:#64748b">Bağlantı kısa süre geçerlidir. Bu isteği sen yapmadıysan bu e-postayı yok say.</p>
    <p style="font-size:12px;color:#94a3b8">${siteUrl}</p>
  </body>
</html>`;
}

/** Direct app link — avoids Supabase verify → redirect_to (often stuck on localhost / zigo.app). */
export function buildRecoveryUrl(tokenHash: string, siteUrl = getSiteUrl()) {
  const url = new URL("/auth/confirm", siteUrl);
  url.searchParams.set("token_hash", tokenHash);
  url.searchParams.set("type", "recovery");
  url.searchParams.set("next", "/auth/reset-password");
  return url.toString();
}

export async function sendRecoveryEmail({ to, recoveryUrl, siteUrl = getAuthRedirectSiteUrl() }: RecoveryEmailInput) {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (resendKey) {
    return sendViaResend({ to, recoveryUrl, siteUrl, apiKey: resendKey });
  }

  throw new Error("recovery_email_unconfigured");
}

async function sendViaResend({
  to,
  recoveryUrl,
  siteUrl = getAuthRedirectSiteUrl(),
  apiKey,
}: RecoveryEmailInput & { apiKey: string; siteUrl: string }) {
  const from = process.env.RESEND_FROM?.trim() || "Zigo <noreply@zigo.app>";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: RECOVERY_SUBJECT,
      html: buildRecoveryEmailHtml(recoveryUrl, siteUrl),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend ${response.status}: ${body.slice(0, 200)}`);
  }

  return { provider: "resend" as const };
}
