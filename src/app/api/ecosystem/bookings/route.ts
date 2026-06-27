import {
  cancelBooking,
  createBooking,
  fetchBookingsForUser,
  updateBooking,
} from "@/features/booking/services";
import {
  createBookingRequestSchema,
  updateBookingRequestSchema,
} from "@/features/booking/types";
import { isErrorResponse, jsonError, jsonSuccess, requireAuthenticatedProfile } from "@/features/shared";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { createClient } from "@/lib/supabase/server";

export const GET = withApiHandler(async () => {
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase, {
    roles: ["parent", "teacher"],
  });
  if (isErrorResponse(profileOrError)) return profileOrError;

  const data = await fetchBookingsForUser(
    supabase,
    profileOrError.id,
    profileOrError.role as "parent" | "teacher",
  );
  return jsonSuccess(data);
}, { fallbackMessage: "Bookings could not be loaded." });

export const POST = withApiHandler(async (request: Request) => {
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase, { roles: ["parent"] });
  if (isErrorResponse(profileOrError)) return profileOrError;

  const body = createBookingRequestSchema.parse(await request.json());
  const booking = await createBooking(supabase, profileOrError.id, body);
  return jsonSuccess(booking, 201);
}, { fallbackMessage: "Booking could not be created." });

export const PATCH = withApiHandler(async (request: Request) => {
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase);
  if (isErrorResponse(profileOrError)) return profileOrError;

  const body = updateBookingRequestSchema.parse(await request.json());

  if (profileOrError.role === "teacher") {
    const updated = await updateBooking(supabase, profileOrError.id, body);
    return jsonSuccess(updated);
  }

  if (profileOrError.role === "parent" && body.status === "cancelled") {
    const updated = await cancelBooking(supabase, body.bookingId, profileOrError.id);
    return jsonSuccess(updated);
  }

  return jsonError("Forbidden", 403, "FORBIDDEN");
}, { fallbackMessage: "Booking could not be updated." });
