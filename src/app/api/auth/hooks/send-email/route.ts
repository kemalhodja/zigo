import { NextResponse } from "next/server";

import { buildRecoveryEmailHtml, buildRecoveryUrl } from "@/lib/server/recovery-email";

const RECOVERY_SUBJECT = "Zigo şifre sıfırlama";

type SendEmailHookPayload = {
  user?: {
    email?: string;
  };
  email_data?: {
    token_hash?: string;
    email_action_type?: string;
    site_url?: string;
    redirect_to?: string;
  };
};

export async function POST(request: Request) {
  const secret = process.env.SEND_EMAIL_HOOK_SECRET?.trim();
  const hookSecret = request.headers.get("x-supabase-hook-secret")?.trim();

  if (secret && hookSecret !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: SendEmailHookPayload;
  try {
    payload = (await request.json()) as SendEmailHookPayload;
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const to = payload.user?.email?.trim();
  const tokenHash = payload.email_data?.token_hash?.trim();
  const actionType = payload.email_data?.email_action_type?.trim();

  if (!to || !tokenHash || actionType !== "recovery") {
    return NextResponse.json({ error: "unsupported_email_action" }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://zigo-kohl.vercel.app";
  const recoveryUrl = buildRecoveryUrl(tokenHash, siteUrl);

  try {
    await deliverRecoveryEmail(to, recoveryUrl, siteUrl);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "send_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function deliverRecoveryEmail(to: string, recoveryUrl: string, siteUrl: string) {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (!resendKey) {
    throw new Error("resend_not_configured");
  }

  const from = process.env.RESEND_FROM?.trim() || "Zigo <noreply@zigo.app>";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
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
    throw new Error(`resend_${response.status}:${body.slice(0, 160)}`);
  }
}
