import { NextResponse } from "next/server";
import { z } from "zod";

import { updateStoreRedemptionStatus } from "@/lib/domain/admin";
import { requirePlatformAdmin } from "@/lib/domain/admin-auth";

export async function PATCH(request: Request) {
  try {
    const auth = await requirePlatformAdmin();

    if ("error" in auth) {
      return auth.error;
    }

    const body = await request.json();
    const redemption = await updateStoreRedemptionStatus(auth.supabase, {
      redemptionId: body.redemptionId,
      status: body.status,
    });

    return NextResponse.json({ data: redemption });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Choose a valid redemption and status."
      : error instanceof Error
        ? error.message
        : "Redemption status could not be updated.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
