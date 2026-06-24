import { NextResponse } from "next/server";
import { z } from "zod";

import { submitStudentDocument } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Sign in before submitting a student document." }, { status: 401 });
    }

    const body = await request.json();
    const profile = await submitStudentDocument(supabase, {
      documentUrl: body.documentUrl,
    });

    return NextResponse.json({ data: profile }, { status: 201 });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Provide a valid document URL under 500 characters."
      : error instanceof Error
        ? error.message
        : "Student document could not be submitted.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
