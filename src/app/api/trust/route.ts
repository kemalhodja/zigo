import { NextResponse } from "next/server";

import { isErrorResponse, requireAuthenticatedProfile } from "@/features/shared/api/require-auth";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import {
  confirmLessonPayment,
  createLessonReview,
  openPaymentDispute,
  submitTeacherCredential,
} from "@/lib/domain/trust";
import { createClient } from "@/lib/supabase/server";

export const POST = withApiHandler(async (request) => {
  const supabase = await createClient();
  const profile = await requireAuthenticatedProfile(supabase);
  if (isErrorResponse(profile)) return profile;

  const body = await request.json();
  const action = String(body.action ?? "");

  if (action === "confirm_payment") {
    if (profile.role !== "teacher" && profile.role !== "parent") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const side = profile.role === "teacher" ? "teacher" : "parent";
    const data = await confirmLessonPayment(supabase, body.bookingId, side);
    return NextResponse.json({ data });
  }

  if (action === "review") {
    if (profile.role !== "parent") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const data = await createLessonReview(supabase, profile.id, {
      bookingId: body.bookingId,
      rating: body.rating,
      comment: body.comment,
    });
    return NextResponse.json({ data }, { status: 201 });
  }

  if (action === "dispute") {
    const data = await openPaymentDispute(supabase, {
      bookingId: body.bookingId,
      reason: body.reason,
    });
    return NextResponse.json({ data }, { status: 201 });
  }

  if (action === "submit_credential") {
    if (profile.role !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const data = await submitTeacherCredential(supabase, profile.id, {
      credentialType: body.credentialType,
      documentUrl: body.documentUrl,
    });
    return NextResponse.json({ data }, { status: 201 });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
});
