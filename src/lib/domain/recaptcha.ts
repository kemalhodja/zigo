import { isLocalDemoSupabase } from "@/lib/domain/demo-env";

type RecaptchaVerifyResponse = {
  success: boolean;
  score?: number;
  action?: string;
  "error-codes"?: string[];
};

export function isRecaptchaConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim() &&
      process.env.RECAPTCHA_SECRET_KEY?.trim(),
  );
}

export function isRecaptchaRequired() {
  if (isLocalDemoSupabase()) return false;
  if (process.env.ZIGO_REQUIRE_RECAPTCHA === "false") return false;
  return isRecaptchaConfigured();
}

export async function verifyRecaptchaToken(token: string, remoteIp?: string) {
  if (!isRecaptchaRequired()) {
    return { ok: true as const, skipped: true as const };
  }

  const secret = process.env.RECAPTCHA_SECRET_KEY?.trim();
  if (!secret) {
    throw new Error("reCAPTCHA is required but RECAPTCHA_SECRET_KEY is missing.");
  }

  const params = new URLSearchParams({
    secret,
    response: token,
  });

  if (remoteIp) {
    params.set("remoteip", remoteIp);
  }

  const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  if (!response.ok) {
    throw new Error("reCAPTCHA verification request failed.");
  }

  const payload = (await response.json()) as RecaptchaVerifyResponse;
  const minScore = Number(process.env.RECAPTCHA_MIN_SCORE ?? "0.5");
  const scoreOk = payload.score === undefined || payload.score >= minScore;

  return {
    ok: payload.success && scoreOk,
    skipped: false as const,
    score: payload.score,
    action: payload.action,
    errorCodes: payload["error-codes"] ?? [],
  };
}

export function getRecaptchaFailureMessage() {
  return "Robot doğrulaması başarısız. Lütfen tekrar dene.";
}

export function getRecaptchaMissingMessage() {
  return "Kayıt için robot doğrulaması gerekli.";
}
