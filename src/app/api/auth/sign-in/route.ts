import { NextResponse } from "next/server";
import { z } from "zod";

import { RateLimitExceededError } from "@/lib/domain/api-errors";
import { requiresEmailConfirmation } from "@/lib/domain/auth-gates";
import {
  authEmailSchema,
  authPasswordSchema,
  enforceAuthRateLimit,
  verifyAuthRecaptcha,
} from "@/lib/server/auth-request";
import { createAuthActionClient, persistRememberMePreference } from "@/lib/supabase/server";

const authSchema = z.object({
  email: authEmailSchema,
  password: authPasswordSchema,
  rememberMe: z.boolean().optional().default(true),
  recaptchaToken: z.string().trim().min(1).optional(),
});

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    const body = authSchema.parse(rawBody);

    const rateLimit = enforceAuthRateLimit(request, "sign-in", 12, 15 * 60_000);
    if (!rateLimit.allowed) {
      throw new RateLimitExceededError(
        "Çok fazla giriş denemesi. Bir süre bekleyip tekrar dene.",
        rateLimit.retryAfterSeconds,
      );
    }

    const recaptcha = await verifyAuthRecaptcha(request, body.recaptchaToken, { email: body.email });
    if (!recaptcha.ok) {
      return NextResponse.json({ error: recaptcha.message }, { status: recaptcha.status });
    }

    const rememberMe = body.rememberMe ?? true;
    const supabase = await createAuthActionClient(rememberMe);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });

    if (error) {
      return NextResponse.json(
        { error: getSignInErrorMessage(error.message, error.status) },
        { status: getSignInStatus(error.message, error.status) },
      );
    }

    if (data.user && requiresEmailConfirmation(data.user)) {
      await supabase.auth.signOut();
      return NextResponse.json(
        {
          error: "E-postanı doğrulamadan giriş yapamazsın. Gelen kutunu kontrol et.",
          needsEmailConfirmation: true,
        },
        { status: 403 },
      );
    }

    await persistRememberMePreference(rememberMe);

    const { data: isPlatformAdmin } = await supabase.rpc("current_user_is_platform_admin");

    return NextResponse.json({ data, isPlatformAdmin: Boolean(isPlatformAdmin) });
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return NextResponse.json(
        { error: error.message, code: "RATE_LIMITED", retryAfterSeconds: error.retryAfterSeconds },
        { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } },
      );
    }

    const message = error instanceof z.ZodError
      ? "Geçerli e-posta ve en az 8 karakterli şifre gir."
      : error instanceof Error
        ? error.message
        : "Giriş tamamlanamadı.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

function getSignInStatus(message: string, status?: number) {
  const normalized = message.toLowerCase();
  if (status === 429 || normalized.includes("rate limit")) {
    return 429;
  }
  return 400;
}

function getSignInErrorMessage(message: string, status?: number) {
  const normalized = message.toLowerCase();

  if (status === 429 || normalized.includes("rate limit")) {
    return "Çok fazla giriş denemesi. Bir süre bekleyip tekrar dene.";
  }

  if (normalized.includes("invalid") || normalized.includes("credentials")) {
    return "E-posta veya şifre hatalı.";
  }

  if (normalized.includes("confirm")) {
    return "E-postanı doğrula, sonra tekrar giriş yap.";
  }

  return "Giriş tamamlanamadı. Bilgilerini kontrol edip tekrar dene.";
}
