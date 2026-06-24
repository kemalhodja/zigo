import { NextResponse } from "next/server";
import { z } from "zod";

import { RateLimitExceededError } from "@/lib/domain/api-errors";
import { requiresEmailConfirmation } from "@/lib/domain/auth-gates";
import { getSiteUrl } from "@/lib/domain/deploy-config";
import { resolveRegistrationAccount } from "@/lib/domain/registration-account";
import {
  authEmailSchema,
  enforceAuthRateLimit,
  registrationPasswordSchema,
  verifyAuthRecaptcha,
} from "@/lib/server/auth-request";
import { createClient } from "@/lib/supabase/server";

const authSchema = z.object({
  email: authEmailSchema,
  fullName: z.string().trim().min(2).max(100),
  password: registrationPasswordSchema,
  role: z.enum(["teacher", "parent", "student"]).optional(),
  accountKind: z.enum(["student", "parent", "teacher", "institution", "platform"]).optional(),
  organizationType: z.enum(["kurs", "okul", "egitim_kurumu", "egitim_platformu"]).optional(),
  recaptchaToken: z.string().trim().min(1).optional(),
}).refine((value) => Boolean(value.role || value.accountKind), {
  message: "Hesap türü seçin.",
});

export async function POST(request: Request) {
  try {
    const rateLimit = enforceAuthRateLimit(request, "sign-up", 6, 60 * 60_000);
    if (!rateLimit.allowed) {
      throw new RateLimitExceededError(
        "Çok fazla kayıt denemesi. Lütfen daha sonra tekrar dene.",
        rateLimit.retryAfterSeconds,
      );
    }

    const requestUrl = new URL(request.url);
    const body = authSchema.parse(await request.json());
    const account = body.accountKind
      ? resolveRegistrationAccount(body.accountKind)
      : {
          role: body.role ?? "student",
          organizationType: body.organizationType ?? null,
        };

    const recaptcha = await verifyAuthRecaptcha(request, body.recaptchaToken);
    if (!recaptcha.ok) {
      return NextResponse.json({ error: recaptcha.message }, { status: recaptcha.status });
    }

    const supabase = await createClient();
    const siteUrl = getSiteUrl(requestUrl.origin);

    const { data, error } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        emailRedirectTo: new URL("/auth/callback?next=/onboarding", siteUrl).toString(),
        data: {
          full_name: body.fullName,
          role: account.role,
          ...(account.organizationType ? { organization_type: account.organizationType } : {}),
          ...(body.accountKind ? { account_kind: body.accountKind } : {}),
        },
      },
    });

    if (error) {
      return NextResponse.json({ error: getSignUpErrorMessage(error.message) }, { status: 400 });
    }

    const needsEmailConfirmation = !data.session || Boolean(data.user && requiresEmailConfirmation(data.user));

    if (data.session && data.user && requiresEmailConfirmation(data.user)) {
      await supabase.auth.signOut();
    }

    return NextResponse.json({
      data: {
        user: data.user,
      },
      profileCreated: Boolean(data.user),
      needsEmailConfirmation,
      message: needsEmailConfirmation
        ? "Hesap oluşturuldu. E-postanı doğrula, ardından giriş yap."
        : "Hesap oluşturuldu. Kuruluma devam et.",
    });
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return NextResponse.json(
        { error: error.message, code: "RATE_LIMITED", retryAfterSeconds: error.retryAfterSeconds },
        { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } },
      );
    }

    const message = error instanceof z.ZodError
      ? error.issues[0]?.message ?? "Geçerli e-posta, ad soyad, rol ve güçlü bir şifre gir."
      : error instanceof Error
        ? error.message
        : "Kayıt tamamlanamadı.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

function getSignUpErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("already") || normalized.includes("registered")) {
    return "Bu e-posta zaten kayıtlı. Giriş yapmayı dene.";
  }

  if (normalized.includes("password")) {
    return "En az 8 karakterli daha güçlü bir şifre kullan.";
  }

  if (normalized.includes("email")) {
    return "Geçerli bir e-posta adresi gir.";
  }

  return "Hesap oluşturulamadı. Bilgilerini kontrol edip tekrar dene.";
}
