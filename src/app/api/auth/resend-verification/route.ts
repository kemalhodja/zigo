import { NextResponse } from "next/server";
import { z } from "zod";

import { getSiteUrl } from "@/lib/domain/deploy-config";
import { createClient } from "@/lib/supabase/server";

const resendSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
});

export async function POST(request: Request) {
  try {
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
      return NextResponse.json({ error: getResendErrorMessage(error.message) }, { status: 400 });
    }

    return NextResponse.json({
      message: "Doğrulama e-postası tekrar gönderildi.",
    });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Geçerli bir e-posta adresi gir."
      : error instanceof Error
        ? error.message
        : "Doğrulama e-postası gönderilemedi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

function getResendErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("rate") || normalized.includes("limit")) {
    return "Çok sık denedin. Birkaç dakika sonra tekrar dene.";
  }

  return "Doğrulama e-postası gönderilemedi. E-posta adresini kontrol et.";
}
