import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";

import { RateLimitExceededError } from "@/lib/domain/api-errors";
import { authGateRedirectPath, resolveAuthGate } from "@/lib/domain/auth-gates";
import {
  authPasswordSchema,
  enforceAuthRateLimit,
  registrationPasswordSchema,
} from "@/lib/server/auth-request";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import { createAuthActionClient, persistRememberMePreference } from "@/lib/supabase/server";

const resetSchema = z
  .object({
    password: registrationPasswordSchema,
    confirmPassword: authPasswordSchema,
    refreshToken: z.string().trim().optional(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Şifreler eşleşmiyor.",
    path: ["confirmPassword"],
  });

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    const body = resetSchema.parse(rawBody);

    const rateLimit = await enforceAuthRateLimit(request, "reset-password", 8, 15 * 60_000);
    if (!rateLimit.allowed) {
      throw new RateLimitExceededError(
        "Çok fazla deneme. Bir süre bekleyip tekrar dene.",
        rateLimit.retryAfterSeconds,
      );
    }

    const authHeader = request.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

    const supabase = await createAuthActionClient(true);

    // If the client passed both access_token (Bearer) and refreshToken from the recovery URL,
    // hydrate the server-side cookie session directly.
    if (bearerToken && body.refreshToken) {
      await supabase.auth
        .setSession({
          access_token: bearerToken,
          refresh_token: body.refreshToken,
        })
        .catch(() => null);
    }

    let {
      data: { user },
    } = await supabase.auth.getUser();

    // Fallback: If cookies were not yet set, verify the user directly via the Bearer JWT
    if (!user && bearerToken) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseAnonKey) {
        const tokenClient = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { headers: { Authorization: `Bearer ${bearerToken}` } },
        });
        const { data: tokenData } = await tokenClient.auth.getUser(bearerToken);
        if (tokenData?.user) {
          user = tokenData.user;
        }
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "Şifre sıfırlama oturumu bulunamadı. E-postadaki bağlantıyı tekrar aç." },
        { status: 401 },
      );
    }

    const admin = createAdminClient();
    if (admin) {
      const { error: adminError } = await admin.auth.admin.updateUserById(user.id, {
        password: body.password,
      });
      if (adminError) {
        return NextResponse.json(
          { error: getResetErrorMessage(adminError.message) },
          { status: 400 },
        );
      }
    } else {
      const { error } = await supabase.auth.updateUser({ password: body.password });
      if (error) {
        return NextResponse.json(
          { error: getResetErrorMessage(error.message) },
          { status: 400 },
        );
      }
    }

    await persistRememberMePreference(true);

    const dbForGate = admin ?? supabase;
    const { data: isPlatformAdmin } = await supabase.rpc("current_user_is_platform_admin");
    const gate = await resolveAuthGate(dbForGate, user);

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
