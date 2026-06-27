import { z } from "zod";

import { validateRegistrationPassword } from "@/lib/domain/password-policy";
import {
  getRecaptchaFailureMessage,
  getRecaptchaMissingMessage,
  isRecaptchaRequired,
  verifyRecaptchaToken,
} from "@/lib/domain/recaptcha";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getClientIp } from "@/lib/server/request-client";

export const authEmailSchema = z
  .string()
  .trim()
  .email()
  .transform((value) => value.toLowerCase());

export const authPasswordSchema = z.string().min(8);

export const registrationPasswordSchema = authPasswordSchema.superRefine((password, ctx) => {
  const result = validateRegistrationPassword(password);
  if (!result.ok) {
    ctx.addIssue({ code: "custom", message: result.message });
  }
});

export async function verifyAuthRecaptcha(request: Request, token?: string) {
  if (!isRecaptchaRequired()) {
    return { ok: true as const };
  }

  if (!token) {
    return { ok: false as const, status: 400 as const, message: getRecaptchaMissingMessage() };
  }

  const verification = await verifyRecaptchaToken(token, getClientIp(request));
  if (!verification.ok) {
    return { ok: false as const, status: 400 as const, message: getRecaptchaFailureMessage() };
  }

  return { ok: true as const };
}

export function shouldBypassAuthRateLimit(request: Request) {
  if (process.env.ZIGO_DISABLE_AUTH_RATE_LIMIT === "1") {
    return true;
  }

  if (process.env.NODE_ENV === "production") {
    return false;
  }

  const ip = getClientIp(request);
  return ip === "127.0.0.1" || ip === "::1" || ip === "unknown" || ip.startsWith("127.");
}

export function enforceAuthRateLimit(
  request: Request,
  scope: "sign-in" | "sign-up" | "resend-verification" | "forgot-password" | "reset-password",
  limit: number,
  windowMs: number,
) {
  if (shouldBypassAuthRateLimit(request)) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  return checkRateLimit(`${scope}:${getClientIp(request)}`, limit, windowMs);
}
