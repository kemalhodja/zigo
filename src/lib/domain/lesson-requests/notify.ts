import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export type LessonRequestNotificationKind =
  | "lesson_request"
  | "lesson_request_urgent"
  | "lesson_request_sent"
  | "lesson_request_accepted"
  | "lesson_request_rejected"
  | "lesson_request_message";

const MESSAGE_BY_KIND: Record<LessonRequestNotificationKind, string> = {
  lesson_request: "yeni ders talebi gönderdi",
  lesson_request_urgent: "ACİL ders talebi gönderdi",
  lesson_request_sent: "Talebiniz öğretmene iletildi.",
  lesson_request_accepted: "ders talebini kabul etti",
  lesson_request_rejected: "ders talebini reddetti",
  lesson_request_message: "ders talebine mesaj gönderdi",
};

export async function notifyLessonRequestEvent(
  supabase: SupabaseClient<Database>,
  input: {
    recipientId: string;
    actorId: string;
    requestId: string;
    kind: LessonRequestNotificationKind;
  },
) {
  if (input.recipientId === input.actorId && input.kind !== "lesson_request_sent") return;

  const { error } = await supabase.rpc("create_lesson_request_notification", {
    recipient_id: input.recipientId,
    actor_id: input.actorId,
    request_id: input.requestId,
    kind: input.kind,
    message: MESSAGE_BY_KIND[input.kind],
  });

  if (error) throw error;
}
