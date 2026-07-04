import { NextResponse } from "next/server";
import { z } from "zod";

import { updateStoreProductStock } from "@/lib/domain/admin";
import { requirePlatformAdmin } from "@/lib/domain/admin-auth";

export async function PATCH(request: Request) {
  try {
    const auth = await requirePlatformAdmin();

    if ("error" in auth) {
      return auth.error;
    }

    const body = await request.json();
    const product = await updateStoreProductStock(auth.supabase, {
      productId: body.productId,
      stockCount: body.stockCount,
    });

    return NextResponse.json({ data: product });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Choose a valid product and a stock count of zero or more."
      : error instanceof Error
        ? error.message
        : "Stock could not be updated.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
