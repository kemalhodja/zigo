import { NextResponse } from "next/server";
import { z } from "zod";

import { reviewStudentDocument } from "@/lib/domain/admin";
import { requirePlatformAdmin } from "@/lib/domain/admin-auth";

export async function POST(request: Request) {
  try {
    const auth = await requirePlatformAdmin();

    if ("error" in auth) {
      return auth.error;
    }

    const body = await request.json();
    const profile = await reviewStudentDocument(auth.supabase, {
      studentId: body.studentId,
      status: body.status,
    });

    return NextResponse.json({ data: profile });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Choose a valid student and review status."
      : error instanceof Error
        ? error.message
        : "Student document review failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
