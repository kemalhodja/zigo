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
import { createClient } from "@/lib/supabase/server";

const authSchema = z.object({
  email: authEmailSchema,
  password: authPasswordSchema,
  recaptchaToken: z.string().trim().min(1).optional(),
});

export async function POST(request: Request) {
  try {
    const rateLimit = enforceAuthRateLimit(request, "sign-in", 12, 15 * 60_000);
    if (!rateLimit.allowed) {
      throw new RateLimitExceededError(
        "Çok fazla giriş denemesi. Bir süre bekleyip tekrar dene.",
        rateLimit.retryAfterSeconds,
      );
    }

    const body = authSchema.parse(await request.json());
    const recaptcha = await verifyAuthRecaptcha(request, body.recaptchaToken);
    if (!recaptcha.ok) {
      return NextResponse.json({ error: recaptcha.message }, { status: recaptcha.status });
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });

    if (error) {
      return NextResponse.json({ error: getSignInErrorMessage(error.message) }, { status: 400 });
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

    return NextResponse.json({ data });
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

function getSignInErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid") || normalized.includes("credentials")) {
    return "E-posta veya şifre hatalı.";
  }

  if (normalized.includes("confirm")) {
    return "E-postanı doğrula, sonra tekrar giriş yap.";
  }

  return "Giriş tamamlanamadı. Bilgilerini kontrol edip tekrar dene.";
}
