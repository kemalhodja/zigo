import { NextResponse } from "next/server";

import { requirePlatformAdmin } from "@/lib/domain/admin-auth";
import { reviewBankTransferRequest } from "@/lib/domain/bank-transfer";

export async function PATCH(request: Request) {
  try {
    const auth = await requirePlatformAdmin();
    if (auth.error) return auth.error;

    const body = await request.json();
    const updated = await reviewBankTransferRequest(auth.supabase, body);

    return NextResponse.json({ data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Havale talebi güncellenemedi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
