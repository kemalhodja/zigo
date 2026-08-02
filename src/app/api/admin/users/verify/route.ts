import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyUser } from "@/lib/domain/admin";
import { requirePlatformAdmin } from "@/lib/domain/admin-auth";

export async function POST(request: Request) {
  try {
    const auth = await requirePlatformAdmin();

    if ("error" in auth) {
      return auth.error;
    }

    const body = await request.json();
    const user = await verifyUser(auth.supabase, {
      userId: body.userId,
      verified: body.verified,
    });

    return NextResponse.json({ data: user });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Choose a valid user and verification status."
      : error instanceof Error
        ? error.message
        : "User verification failed.";
    return NextResponse.json({ error: message, fullError: error }, { status: 400 });
  }
}
