import type { SupabaseClient } from "@supabase/supabase-js";
import type { NextResponse } from "next/server";

import { jsonError } from "@/features/shared/errors/global-error-handler";
import { getLessonRequestById, type LessonRequestRow } from "@/lib/domain/lesson-requests/queries";
import type { Database, UserRole } from "@/lib/supabase/database.types";

export function assertNotStudentRole(role: UserRole): NextResponse | null {
  if (role === "student") {
    return jsonError("Students cannot access professional lesson requests.", 403, "FORBIDDEN");
  }
  return null;
}

export async function requireLessonRequestParticipant(
  supabase: SupabaseClient<Database>,
  requestId: string,
  profileId: string,
): Promise<{ request: LessonRequestRow } | NextResponse> {
  const requestRow = await getLessonRequestById(supabase, requestId);
  if (!requestRow) {
    return jsonError("Not found", 404, "NOT_FOUND");
  }

  const isParticipant = requestRow.sender_id === profileId || requestRow.receiver_id === profileId;
  if (!isParticipant) {
    return jsonError("Forbidden", 403, "FORBIDDEN");
  }

  return { request: requestRow };
}
