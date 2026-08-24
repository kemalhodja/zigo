import { NextResponse } from "next/server";
import { z } from "zod";

import { respondWithDomainError } from "@/lib/domain/api-errors";
import {
  createParentalConsentRequest,
  getParentalConsentStatus,
} from "@/lib/domain/parental-consent";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  parentEmail: z.string().trim().min(5).max(200),
});

export async function GET() {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const status = await getParentalConsentStatus(supabase, profile.id);
    return NextResponse.json({ data: { status } });
  } catch (error) {
    return respondWithDomainError(error, "Onam durumu alınamadı.");
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 503 });
    }

    const body = requestSchema.parse(await request.json().catch(() => ({})));
    const result = await createParentalConsentRequest(admin, profile.id, body.parentEmail);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // The raw token is shown once so the student can hand the consent link to
    // their parent. Only its hash is persisted.
    return NextResponse.json({
      data: {
        status: "pending",
        parentEmail: result.parentEmail,
        consentUrl: `/legal/parental-consent?token=${result.token}`,
      },
    });
  } catch (error) {
    return respondWithDomainError(error, "Onam talebi oluşturulamadı.");
  }
}
