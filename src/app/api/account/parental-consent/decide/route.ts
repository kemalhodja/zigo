import { NextResponse } from "next/server";
import { z } from "zod";

import { respondWithDomainError } from "@/lib/domain/api-errors";
import { decideParentalConsent } from "@/lib/domain/parental-consent";
import { createAdminClient } from "@/lib/supabase/admin";

const decideSchema = z.object({
  token: z.string().trim().min(32).max(128),
  decision: z.enum(["approved", "rejected"]),
});

export async function POST(request: Request) {
  try {
    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 503 });
    }

    const body = decideSchema.parse(await request.json().catch(() => ({})));
    const result = await decideParentalConsent(admin, body.token, body.decision);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ data: { status: result.status } });
  } catch (error) {
    return respondWithDomainError(error, "Onam kararı işlenemedi.");
  }
}
