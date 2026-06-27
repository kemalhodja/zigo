import { NextResponse } from "next/server";

import {
  createAvailabilitySlot,
  deleteAvailabilitySlot,
  fetchTeacherOpenSlots,
  listTeacherOwnSlots,
} from "@/features/booking/services";
import {
  createAvailabilityBodySchema,
  deleteAvailabilityQuerySchema,
} from "@/features/booking/types";
import { isErrorResponse, jsonError, jsonSuccess, requireAuthenticatedProfile } from "@/features/shared";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { createClient } from "@/lib/supabase/server";

export const GET = withApiHandler(async (request: Request) => {
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase);
  if (isErrorResponse(profileOrError)) return profileOrError;

  if (profileOrError.role === "teacher") {
    const data = await listTeacherOwnSlots(supabase, profileOrError.id);
    return jsonSuccess(data);
  }

  const teacherId = new URL(request.url).searchParams.get("teacherId") ?? undefined;
  if (profileOrError.role === "parent" && teacherId) {
    const data = await fetchTeacherOpenSlots(supabase, teacherId);
    return jsonSuccess(data);
  }

  return jsonError("Forbidden", 403, "FORBIDDEN");
}, { fallbackMessage: "Availability could not be loaded." });

export const POST = withApiHandler(async (request: Request) => {
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase, {
    roles: ["teacher"],
    requireVerified: true,
  });
  if (isErrorResponse(profileOrError)) return profileOrError;

  const body = createAvailabilityBodySchema.parse(await request.json());
  const created = await createAvailabilitySlot(supabase, {
    teacherId: profileOrError.id,
    startTime: body.startTime,
    endTime: body.endTime,
  });

  return jsonSuccess(created, 201);
}, { fallbackMessage: "Availability slot could not be created." });

export const DELETE = withApiHandler(async (request: Request) => {
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase, { roles: ["teacher"] });
  if (isErrorResponse(profileOrError)) return profileOrError;

  const slotId = new URL(request.url).searchParams.get("id");
  const parsed = deleteAvailabilityQuerySchema.parse({ id: slotId });

  await deleteAvailabilitySlot(supabase, parsed.id, profileOrError.id);
  return NextResponse.json({ ok: true });
}, { fallbackMessage: "Availability slot could not be deleted." });
