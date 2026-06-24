import { NextResponse } from "next/server";
import { z } from "zod";

import { respondWithDomainError } from "@/lib/domain/api-errors";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { updateParentStoreRedemption } from "@/lib/domain/store";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (profile.role !== "parent") {
      return NextResponse.json({ error: "Only parent accounts can approve reward redemptions." }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const data = await updateParentStoreRedemption(supabase, {
      redemptionId: id,
      status: body.status,
    });

    return NextResponse.json({ data, meta: { action: "parent-store-redemption" } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Choose approve or cancel for a valid redemption." }, { status: 400 });
    }

    return respondWithDomainError(error, "Reward approval could not be saved.");
  }
}
