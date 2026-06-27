import type { SupabaseClient } from "@supabase/supabase-js";

import { notifyLessonRequestEvent } from "@/lib/domain/lesson-requests/notify";
import { isPushConfigured } from "@/lib/domain/push-notifications";
import type { Database } from "@/lib/supabase/database.types";

/** Central dispatch for lesson-request in-app notifications (PostgreSQL + RLS). */
export async function notifyUrgentLessonRequest(
  supabase: SupabaseClient<Database>,
  input: {
    recipientId: string;
    actorId: string;
    requestId: string;
  },
) {
  await notifyLessonRequestEvent(supabase, {
    recipientId: input.recipientId,
    actorId: input.actorId,
    requestId: input.requestId,
    kind: "lesson_request_urgent",
  }).catch(() => undefined);

  if (isPushConfigured()) {
    // Future: FCM / web push via edge function.
  }
}

export async function notifyLessonRequestSentConfirmation(
  supabase: SupabaseClient<Database>,
  input: {
    parentId: string;
    requestId: string;
  },
) {
  return notifyLessonRequestEvent(supabase, {
    recipientId: input.parentId,
    actorId: input.parentId,
    requestId: input.requestId,
    kind: "lesson_request_sent",
  }).catch(() => undefined);
}

export async function notifyLessonRequestCreated(
  supabase: SupabaseClient<Database>,
  input: {
    recipientId: string;
    actorId: string;
    requestId: string;
    priority: "normal" | "urgent";
  },
) {
  if (input.priority === "urgent") {
    return notifyUrgentLessonRequest(supabase, input);
  }

  return notifyLessonRequestEvent(supabase, {
    recipientId: input.recipientId,
    actorId: input.actorId,
    requestId: input.requestId,
    kind: "lesson_request",
  }).catch(() => undefined);
}

export async function notifyLessonRequestStatusChange(
  supabase: SupabaseClient<Database>,
  input: {
    recipientId: string;
    actorId: string;
    requestId: string;
    status: "accepted" | "rejected";
  },
) {
  const kind =
    input.status === "accepted" ? "lesson_request_accepted" : "lesson_request_rejected";

  return notifyLessonRequestEvent(supabase, {
    recipientId: input.recipientId,
    actorId: input.actorId,
    requestId: input.requestId,
    kind,
  }).catch(() => undefined);
}
