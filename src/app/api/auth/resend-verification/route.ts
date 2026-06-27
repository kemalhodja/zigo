import { NextResponse } from "next/server";
import { z } from "zod";

import { RateLimitExceededError } from "@/lib/domain/api-errors";
import { getSiteUrl } from "@/lib/domain/deploy-config";
import { enforceAuthRateLimit } from "@/lib/server/auth-request";
import { createClient } from "@/lib/supabase/server";

const resendSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
});

export async function POST(request: Request) {
  try {
    const rateLimit = enforceAuthRateLimit(request, "resend-verification", 4, 15 * 60_000);
    if (!rateLimit.allowed) {
      throw new RateLimitExceededError(
        "Çok sık denedin. Birkaç dakika sonra tekrar dene.",
        rateLimit.retryAfterSeconds,
      );
    }

    const requestUrl = new URL(request.url);
    const body = resendSchema.parse(await request.json());
    const supabase = await createClient();
    const siteUrl = getSiteUrl(requestUrl.origin);

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: body.email,
      options: {
        emailRedirectTo: new URL("/auth/callback?next=/onboarding", siteUrl).toString(),
      },
    });

    if (error) {
      return NextResponse.json(
        { error: getResendErrorMessage(error.message, error.status) },
        { status: getResendStatus(error.message, error.status) },
      );
    }

    return NextResponse.json({
      message: "Doğrulama e-postası tekrar gönderildi.",
    });
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return NextResponse.json(
        { error: error.message, code: "RATE_LIMITED", retryAfterSeconds: error.retryAfterSeconds },
        { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } },
      );
    }

    const message = error instanceof z.ZodError
      ? "Geçerli bir e-posta adresi gir."
      : error instanceof Error
        ? error.message
        : "Doğrulama e-postası gönderilemedi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

function getResendStatus(message: string, status?: number) {
  const normalized = message.toLowerCase();
  if (status === 429 || normalized.includes("rate") || normalized.includes("limit")) {
    return 429;
  }
  return 400;
}

function getResendErrorMessage(message: string, status?: number) {
  const normalized = message.toLowerCase();

  if (status === 429 || normalized.includes("rate") || normalized.includes("limit")) {
    return "Çok sık denedin. Birkaç dakika sonra tekrar dene.";
  }

  return "Doğrulama e-postası gönderilemedi. E-posta adresini kontrol et.";
}
