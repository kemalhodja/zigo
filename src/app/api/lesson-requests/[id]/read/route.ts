import { NextResponse } from "next/server";

import { markLessonRequestThreadRead } from "@/features/lesson/services";
import {
  assertNotStudentRole,
  requireLessonRequestParticipant,
} from "@/features/lesson/services/lesson-access.service";
import { isErrorResponse, requireAuthenticatedProfile } from "@/features/shared";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const POST = withApiHandler(async (_request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase);
  if (isErrorResponse(profileOrError)) return profileOrError;

  const studentBlock = assertNotStudentRole(profileOrError.role);
  if (studentBlock) return studentBlock;

  const participantOrError = await requireLessonRequestParticipant(supabase, id, profileOrError.id);
  if (isErrorResponse(participantOrError)) return participantOrError;

  const updated = await markLessonRequestThreadRead(supabase, id, profileOrError.id);
  return NextResponse.json({ updated });
}, { fallbackMessage: "Thread could not be marked as read." });
