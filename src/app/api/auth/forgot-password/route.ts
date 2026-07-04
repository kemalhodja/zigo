import { NextResponse } from "next/server";
import { z } from "zod";

import { RateLimitExceededError } from "@/lib/domain/api-errors";
import { authEmailSchema, enforceAuthRateLimit } from "@/lib/server/auth-request";
import {
  FORGOT_PASSWORD_ACCOUNT_NOT_FOUND,
  FORGOT_PASSWORD_RATE_LIMIT,
  FORGOT_PASSWORD_SEND_FAILED,
  FORGOT_PASSWORD_SUCCESS,
  requestPasswordReset,
} from "@/lib/server/password-reset";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const forgotSchema = z.object({
  email: authEmailSchema,
});

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    const body = forgotSchema.parse(rawBody);

    const rateLimit = enforceAuthRateLimit(request, "forgot-password", 4, 15 * 60_000);
    if (!rateLimit.allowed) {
      throw new RateLimitExceededError(FORGOT_PASSWORD_RATE_LIMIT, rateLimit.retryAfterSeconds);
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: FORGOT_PASSWORD_SEND_FAILED }, { status: 503 });
    }

    const supabase = await createClient();
    const requestUrl = new URL(request.url);
    const result = await requestPasswordReset({
      admin,
      anon: supabase,
      email: body.email,
      requestOrigin: requestUrl.origin,
    });

    if (result.ok) {
      return NextResponse.json({ message: FORGOT_PASSWORD_SUCCESS });
    }

    if (result.code === "ACCOUNT_NOT_FOUND") {
      return NextResponse.json({ error: FORGOT_PASSWORD_ACCOUNT_NOT_FOUND, code: "ACCOUNT_NOT_FOUND" }, { status: 404 });
    }

    if (result.code === "RATE_LIMITED") {
      return NextResponse.json({ error: FORGOT_PASSWORD_RATE_LIMIT, code: "RATE_LIMITED" }, { status: 429 });
    }

    return NextResponse.json({ error: FORGOT_PASSWORD_SEND_FAILED, code: "SEND_FAILED" }, { status: 503 });
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return NextResponse.json(
        { error: error.message, code: "RATE_LIMITED", retryAfterSeconds: error.retryAfterSeconds },
        { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } },
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Geçerli bir e-posta adresi gir." }, { status: 400 });
    }

    return NextResponse.json({ error: FORGOT_PASSWORD_SEND_FAILED, code: "SEND_FAILED" }, { status: 503 });
  }
}
