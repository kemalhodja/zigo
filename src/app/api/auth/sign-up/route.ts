import { NextResponse } from "next/server";
import { z } from "zod";

import { RateLimitExceededError } from "@/lib/domain/api-errors";
import { isEmailConfirmationEnforced, requiresEmailConfirmation } from "@/lib/domain/auth-gates";
import { getSiteUrl } from "@/lib/domain/deploy-config";
import { resolveRegistrationAccount } from "@/lib/domain/registration-account";
import {
  authEmailSchema,
  enforceAuthRateLimit,
  registrationPasswordSchema,
  verifyAuthRecaptcha,
} from "@/lib/server/auth-request";
import { createAdminClient } from "@/lib/supabase/admin";
import { createAuthActionClient, persistRememberMePreference } from "@/lib/supabase/server";

const authSchema = z.object({
  email: authEmailSchema,
  fullName: z
    .string()
    .trim()
    .min(2, "Ad soyad en az 2 karakter olmalı.")
    .max(100, "Ad soyad en fazla 100 karakter olabilir."),
  password: registrationPasswordSchema,
  role: z.enum(["teacher", "parent", "student", "platform"]).optional(),
  accountKind: z.enum(["student", "parent", "teacher", "institution", "platform"]).optional(),
  organizationType: z
    .enum(["kurs", "okul", "egitim_kurumu", "egitim_platformu"])
    .nullish(),
  recaptchaToken: z.string().trim().min(1).optional(),
}).refine((value) => Boolean(value.role || value.accountKind), {
  message: "Hesap türü seçin.",
});

export async function POST(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const rawBody = await request.json();
    const body = authSchema.parse(rawBody);
    const account = body.accountKind
      ? resolveRegistrationAccount(body.accountKind)
      : {
          role: body.role ?? "student",
          organizationType: body.organizationType ?? null,
        };

    const rateLimit = enforceAuthRateLimit(request, "sign-up", 6, 60 * 60_000, { email: body.email });
    if (!rateLimit.allowed) {
      throw new RateLimitExceededError(
        "Çok fazla kayıt denemesi. Lütfen daha sonra tekrar dene.",
        rateLimit.retryAfterSeconds,
      );
    }

    const recaptcha = await verifyAuthRecaptcha(request, body.recaptchaToken, { email: body.email });
    if (!recaptcha.ok) {
      return NextResponse.json({ error: recaptcha.message }, { status: recaptcha.status });
    }

    const userMetadata = {
      full_name: body.fullName,
      role: account.role,
      ...(account.organizationType ? { organization_type: account.organizationType } : {}),
      ...(body.accountKind ? { account_kind: body.accountKind } : {}),
    };

    const supabase = await createAuthActionClient(true);

    if (!isEmailConfirmationEnforced()) {
      const admin = createAdminClient();
      if (!admin) {
        return NextResponse.json(
          { error: "Kayıt servisi yapılandırılmamış. Lütfen daha sonra tekrar dene." },
          { status: 503 },
        );
      }

      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email: body.email,
        password: body.password,
        email_confirm: true,
        user_metadata: userMetadata,
      });

      if (createError) {
        return NextResponse.json(
          { error: getSignUpErrorMessage(createError.message, createError.status) },
          { status: getSignUpStatus(createError.message, createError.status) },
        );
      }

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: body.email,
        password: body.password,
      });

      if (signInError || !signInData.session) {
        return NextResponse.json(
          {
            error: signInError
              ? getSignUpErrorMessage(signInError.message, signInError.status)
              : "Hesap oluşturuldu ama oturum açılamadı. Giriş yapmayı dene.",
            profileCreated: Boolean(created.user),
            needsEmailConfirmation: false,
          },
          { status: signInError ? getSignUpStatus(signInError.message, signInError.status) : 503 },
        );
      }

      await persistRememberMePreference(true);

      return NextResponse.json({
        data: {
          user: signInData.user,
        },
        profileCreated: Boolean(created.user),
        needsEmailConfirmation: false,
        message: "Hesap oluşturuldu. Kuruluma devam et.",
      });
    }

    const siteUrl = getSiteUrl(requestUrl.origin);

    const { data, error } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        emailRedirectTo: new URL("/auth/callback?next=/onboarding", siteUrl).toString(),
        data: userMetadata,
      },
    });

    if (error) {
      return NextResponse.json(
        { error: getSignUpErrorMessage(error.message, error.status) },
        { status: getSignUpStatus(error.message, error.status) },
      );
    }

    if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
      return NextResponse.json(
        { error: "Bu e-posta zaten kayıtlı. Giriş yapmayı dene." },
        { status: 400 },
      );
    }

    const needsEmailConfirmation = !data.session || Boolean(data.user && requiresEmailConfirmation(data.user));

    if (data.session && data.user && requiresEmailConfirmation(data.user)) {
      await supabase.auth.signOut();
    } else if (data.session) {
      await persistRememberMePreference(true);
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
      ? getSignUpValidationMessage(error)
      : error instanceof Error
        ? error.message
        : "Kayıt tamamlanamadı.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

function getSignUpValidationMessage(error: z.ZodError) {
  for (const issue of error.issues) {
    if (issue.path[0] === "email") {
      return "Geçerli bir e-posta adresi gir.";
    }
    if (issue.path[0] === "fullName" && issue.message) {
      return issue.message;
    }
    if (issue.path[0] === "password" && issue.message) {
      return issue.message;
    }
    if (issue.message) {
      return issue.message;
    }
  }

  return "Geçerli e-posta, ad soyad, rol ve güçlü bir şifre gir.";
}

function getSignUpStatus(message: string, status?: number) {
  const normalized = message.toLowerCase();
  if (status === 429 || normalized.includes("rate limit")) {
    return 429;
  }
  return 400;
}

function getSignUpErrorMessage(message: string, status?: number) {
  const normalized = message.toLowerCase();

  if (status === 429 || normalized.includes("rate limit") || normalized.includes("over_email_send_rate_limit")) {
    return "Çok fazla kayıt denemesi yapıldı. Bir saat bekleyip tekrar dene veya farklı bir ağ dene.";
  }

  if (normalized.includes("already") || normalized.includes("registered") || normalized.includes("exists")) {
    return "Bu e-posta zaten kayıtlı. Giriş yapmayı dene.";
  }

  if (normalized.includes("password")) {
    return "En az 8 karakterli daha güçlü bir şifre kullan.";
  }

  if (normalized.includes("invalid email") || normalized.includes("unable to validate email")) {
    return "Geçerli bir e-posta adresi gir.";
  }

  return "Hesap oluşturulamadı. Bilgilerini kontrol edip tekrar dene.";
}
