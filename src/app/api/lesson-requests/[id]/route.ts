import {
  createLessonRequestMessage,
  getLessonRequestThread,
  markLessonRequestThreadRead,
  updateLessonRequestStatus,
} from "@/features/lesson/services";
import {
  assertNotStudentRole,
  requireLessonRequestParticipant,
} from "@/features/lesson/services/lesson-access.service";
import {
  createLessonRequestMessageBodySchema,
  updateLessonRequestBodySchema,
} from "@/features/lesson/types";
import { isErrorResponse, jsonSuccess, requireAuthenticatedProfile } from "@/features/shared";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = withApiHandler(async (_request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase);
  if (isErrorResponse(profileOrError)) return profileOrError;

  const studentBlock = assertNotStudentRole(profileOrError.role);
  if (studentBlock) return studentBlock;

  const participantOrError = await requireLessonRequestParticipant(supabase, id, profileOrError.id);
  if (isErrorResponse(participantOrError)) return participantOrError;

  const thread = await getLessonRequestThread(supabase, id);
  await markLessonRequestThreadRead(supabase, id, profileOrError.id).catch(() => 0);
  return jsonSuccess({ request: participantOrError.request, thread });
}, { fallbackMessage: "Lesson request could not be loaded." });

export const PATCH = withApiHandler(async (request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase);
  if (isErrorResponse(profileOrError)) return profileOrError;

  const studentBlock = assertNotStudentRole(profileOrError.role);
  if (studentBlock) return studentBlock;

  const body = updateLessonRequestBodySchema.parse(await request.json());
  const updated = await updateLessonRequestStatus(supabase, {
    requestId: id,
    actorId: profileOrError.id,
    status: body.status,
  });

  return jsonSuccess(updated);
}, { fallbackMessage: "Lesson request could not be updated." });

export const POST = withApiHandler(async (request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase);
  if (isErrorResponse(profileOrError)) return profileOrError;

  const studentBlock = assertNotStudentRole(profileOrError.role);
  if (studentBlock) return studentBlock;

  const body = createLessonRequestMessageBodySchema.parse(await request.json());
  const message = await createLessonRequestMessage(supabase, {
    requestId: id,
    senderId: profileOrError.id,
    content: body.content,
  });

  return jsonSuccess(message, 201);
}, { fallbackMessage: "Message could not be sent." });
