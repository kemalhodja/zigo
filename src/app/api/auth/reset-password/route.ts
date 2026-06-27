import { NextResponse } from "next/server";
import { z } from "zod";

import { RateLimitExceededError } from "@/lib/domain/api-errors";
import { authGateRedirectPath, resolveAuthGate } from "@/lib/domain/auth-gates";
import {
  authPasswordSchema,
  enforceAuthRateLimit,
  registrationPasswordSchema,
} from "@/lib/server/auth-request";
import { createAuthActionClient, persistRememberMePreference } from "@/lib/supabase/server";

const resetSchema = z
  .object({
    password: registrationPasswordSchema,
    confirmPassword: authPasswordSchema,
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Şifreler eşleşmiyor.",
    path: ["confirmPassword"],
  });

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    const body = resetSchema.parse(rawBody);

    const rateLimit = enforceAuthRateLimit(request, "reset-password", 8, 15 * 60_000);
    if (!rateLimit.allowed) {
      throw new RateLimitExceededError(
        "Çok fazla deneme. Bir süre bekleyip tekrar dene.",
        rateLimit.retryAfterSeconds,
      );
    }

    const supabase = await createAuthActionClient(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Şifre sıfırlama oturumu bulunamadı. E-postadaki bağlantıyı tekrar aç." },
        { status: 401 },
      );
    }

    const { error } = await supabase.auth.updateUser({ password: body.password });
    if (error) {
      return NextResponse.json(
        { error: getResetErrorMessage(error.message) },
        { status: 400 },
      );
    }

    await persistRememberMePreference(true);

    const { data: isPlatformAdmin } = await supabase.rpc("current_user_is_platform_admin");
    const gate = await resolveAuthGate(supabase, user);

    return NextResponse.json({
      message: "Şifren güncellendi. Yönlendiriliyorsun…",
      isPlatformAdmin: Boolean(isPlatformAdmin),
      redirectTo: authGateRedirectPath(gate, { isPlatformAdmin: Boolean(isPlatformAdmin) }),
    });
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return NextResponse.json(
        { error: error.message, code: "RATE_LIMITED", retryAfterSeconds: error.retryAfterSeconds },
        { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } },
      );
    }

    const message =
      error instanceof z.ZodError
        ? (error.issues[0]?.message ?? "Geçerli ve eşleşen şifreler gir.")
        : error instanceof Error
          ? error.message
          : "Şifre güncellenemedi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

function getResetErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("same")) {
    return "Yeni şifre eskisiyle aynı olamaz.";
  }

  if (normalized.includes("password")) {
    return "En az 8 karakterli daha güçlü bir şifre kullan.";
  }

  return "Şifre güncellenemedi. Tekrar dene.";
}
