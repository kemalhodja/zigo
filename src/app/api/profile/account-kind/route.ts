import { NextResponse } from "next/server";
import { z } from "zod";

import { respondWithDomainError } from "@/lib/domain/api-errors";
import { updateOwnAccountKind } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Giriş yapmadan hesap türü güncellenemez." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const profile = await updateOwnAccountKind(supabase, {
      accountKind: body.accountKind,
    });

    return NextResponse.json({
      data: profile,
      message: "Hesap türü güncellendi. Alan seçimini yeniden yapmanız gerekebilir.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Geçerli bir hesap türü seçin." }, { status: 400 });
    }

    return respondWithDomainError(error, "Hesap türü güncellenemedi.");
  }
}
