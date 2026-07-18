import { NextResponse } from "next/server";
import { z } from "zod";

import { adminUpdateUserStatus } from "@/lib/domain/admin";
import { requirePlatformAdmin } from "@/lib/domain/admin-auth";

export async function POST(request: Request) {
  try {
    const auth = await requirePlatformAdmin();
    if ("error" in auth) return auth.error;

    const body = await request.json();
    await adminUpdateUserStatus(auth.supabase, {
      userId: body.userId,
      status: body.status,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Invalid status parameters"
      : (error as any)?.message || "Failed to update user status";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
