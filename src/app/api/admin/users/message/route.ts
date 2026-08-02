import { NextResponse } from "next/server";
import { z } from "zod";

import { adminSendUserMessage } from "@/lib/domain/admin";
import { requirePlatformAdmin } from "@/lib/domain/admin-auth";

export async function POST(request: Request) {
  try {
    const auth = await requirePlatformAdmin();
    if ("error" in auth) return auth.error;

    const body = await request.json();
    await adminSendUserMessage(auth.supabase, {
      userId: body.userId,
      title: body.title,
      body: body.body,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Invalid message parameters"
      : error instanceof Error
        ? error.message
        : "Failed to send message";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
