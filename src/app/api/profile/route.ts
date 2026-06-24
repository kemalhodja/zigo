import { NextResponse } from "next/server";
import { z } from "zod";

import { respondWithDomainError } from "@/lib/domain/api-errors";
import { createProfile, updateUserProfile } from "@/lib/domain/profiles";
import { isRegistrationAccountKind } from "@/lib/domain/registration-account";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Sign in before creating a profile." }, { status: 401 });
    }

    const body = await request.json();

    const profile = await createProfile(supabase, {
      fullName: body.fullName,
      role: body.role,
      accountKind: isRegistrationAccountKind(body.accountKind) ? body.accountKind : undefined,
    });

    return NextResponse.json({ data: profile }, { status: 201 });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Enter a full name between 2 and 100 characters and choose student, parent or teacher."
      : error instanceof Error
        ? error.message
        : "Profile could not be created.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Sign in before updating your profile." }, { status: 401 });
    }

    const body = await request.json();
    const profile = await updateUserProfile(supabase, {
      bio: body.bio,
      avatarUrl: body.avatarUrl,
    });

    return NextResponse.json({ data: profile });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Bio must be under 500 characters and avatar URL must be valid." },
        { status: 400 },
      );
    }

    return respondWithDomainError(error, "Profile could not be updated.");
  }
}
