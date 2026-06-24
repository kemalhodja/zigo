import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { redeemChildStoreProduct, redeemStoreProduct } from "@/lib/domain/store";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (profile.role === "student") {
      const redemption = await redeemStoreProduct(supabase, {
        productId: body.productId,
        note: body.note,
      });

      return NextResponse.json({ data: redemption }, { status: 201 });
    }

    if (profile.role === "parent") {
      const redemption = await redeemChildStoreProduct(supabase, {
        childProfileId: body.childProfileId,
        productId: body.productId,
        note: body.note,
      });

      return NextResponse.json({ data: redemption }, { status: 201 });
    }

    return NextResponse.json({ error: "Teachers cannot redeem student rewards." }, { status: 403 });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Choose a valid reward and keep notes under 500 characters."
      : error instanceof Error
        ? error.message
        : "Reward could not be redeemed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
