import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";

import { DomainForbiddenError } from "@/lib/domain/domain-errors";
import { parentHasActiveLessonPackage } from "@/lib/domain/lesson-packages";
import { getUserInterestAreaIds } from "@/lib/domain/profiles";
import { runModeratedSafeTextAction } from "@/lib/domain/moderation-policy";
import type { Database } from "@/lib/supabase/database.types";

import { getLessonRequestById } from "./queries";
import { notifyLessonRequestEvent } from "./notify";
import {
  notifyLessonRequestCreated,
  notifyLessonRequestSentConfirmation,
  notifyLessonRequestStatusChange,
} from "@/features/notifications/services/dispatch.service";
import {
  createLessonRequestMessageSchema,
  createLessonRequestSchema,
  updateLessonRequestStatusSchema,
} from "./schemas";

export async function createLessonRequest(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof createLessonRequestSchema>,
) {
  const parsed = createLessonRequestSchema.parse(input);

  if (parsed.senderId === parsed.receiverId) {
    throw new DomainForbiddenError("You cannot send a request to yourself.");
  }

  const { data: sender, error: senderError } = await supabase
    .from("users")
    .select("role")
    .eq("id", parsed.senderId)
    .single();

  if (senderError) throw senderError;

  if (sender.role !== "parent") {
    throw new DomainForbiddenError("Only parents can create lesson requests.", "STUDENT_MESSAGING_BLOCKED");
  }

  if (!(await parentHasActiveLessonPackage(supabase, parsed.senderId))) {
    throw new DomainForbiddenError(
      "An active lesson package is required before sending lesson requests.",
      "LESSON_PACKAGE_REQUIRED",
    );
  }

  const { data: receiver, error: receiverError } = await supabase
    .from("users")
    .select("role, is_verified")
    .eq("id", parsed.receiverId)
    .single();

  if (receiverError) throw receiverError;

  if (receiver.role !== "teacher" || !receiver.is_verified) {
    throw new DomainForbiddenError("Lesson requests can only be sent to verified teachers.");
  }

  const parentAreaIds = await getUserInterestAreaIds(supabase, parsed.senderId);
  if (parentAreaIds.length === 0) {
    throw new DomainForbiddenError("Select education areas before sending a lesson request.");
  }

  if (parsed.areaId && !parentAreaIds.includes(parsed.areaId)) {
    throw new DomainForbiddenError("Lesson requests must use one of your selected education areas.");
  }

  const { data: teacherAreas, error: teacherAreaError } = await supabase
    .from("user_interests")
    .select("area_id")
    .eq("user_id", parsed.receiverId)
    .in("area_id", parsed.areaId ? [parsed.areaId] : parentAreaIds);

  if (teacherAreaError) throw teacherAreaError;

  if (!teacherAreas?.length) {
    throw new DomainForbiddenError("This teacher is not assigned to your selected education areas.");
  }

  if (parsed.childProfileId) {
    const { data: child, error: childError } = await supabase
      .from("child_profiles")
      .select("id")
      .eq("id", parsed.childProfileId)
      .eq("parent_id", parsed.senderId)
      .maybeSingle();

    if (childError) throw childError;
    if (!child) {
      throw new DomainForbiddenError("Choose one of your linked child profiles.");
    }
  }

  let pendingQuery = supabase
    .from("lesson_requests")
    .select("id")
    .eq("sender_id", parsed.senderId)
    .eq("receiver_id", parsed.receiverId)
    .eq("status", "pending");

  pendingQuery = parsed.childProfileId
    ? pendingQuery.eq("child_profile_id", parsed.childProfileId)
    : pendingQuery.is("child_profile_id", null);

  const { data: pendingDuplicate, error: duplicateError } = await pendingQuery.maybeSingle();
  if (duplicateError) throw duplicateError;

  if (pendingDuplicate) {
    throw new DomainForbiddenError("You already have a pending request with this teacher.");
  }

  return runModeratedSafeTextAction(
    supabase,
    {
      userId: parsed.senderId,
      contentKind: "other",
      text: parsed.messageBody,
    },
    async (messageBody) => {
      const { data, error } = await supabase
        .from("lesson_requests")
        .insert({
          sender_id: parsed.senderId,
          receiver_id: parsed.receiverId,
          child_profile_id: parsed.childProfileId ?? null,
          area_id: parsed.areaId ?? null,
          message_body: messageBody,
          priority: parsed.priority,
        })
        .select("*")
        .single();

      if (error) throw error;
      await notifyLessonRequestCreated(supabase, {
        recipientId: parsed.receiverId,
        actorId: parsed.senderId,
        requestId: data.id,
        priority: parsed.priority,
      }).catch(() => undefined);
      await notifyLessonRequestSentConfirmation(supabase, {
        parentId: parsed.senderId,
        requestId: data.id,
      }).catch(() => undefined);
      return data;
    },
  );
}

function assertLessonRequestStatusTransition(
  currentStatus: Database["public"]["Tables"]["lesson_requests"]["Row"]["status"],
  nextStatus: "accepted" | "rejected" | "closed",
) {
  if (nextStatus === "accepted" || nextStatus === "rejected") {
    if (currentStatus !== "pending") {
      throw new DomainForbiddenError("Only pending requests can be accepted or rejected.");
    }
    return;
  }

  if (currentStatus !== "pending" && currentStatus !== "accepted") {
    throw new DomainForbiddenError("This request cannot be closed.");
  }
}

export async function updateLessonRequestStatus(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof updateLessonRequestStatusSchema>,
) {
  const parsed = updateLessonRequestStatusSchema.parse(input);
  const request = await getLessonRequestById(supabase, parsed.requestId);

  if (!request) {
    throw new DomainForbiddenError("Lesson request not found.");
  }

  const isSender = request.sender_id === parsed.actorId;
  const isReceiver = request.receiver_id === parsed.actorId;

  if (!isSender && !isReceiver) {
    throw new DomainForbiddenError("You are not a participant in this request.");
  }

  if (parsed.status === "accepted" || parsed.status === "rejected") {
    if (!isReceiver) {
      throw new DomainForbiddenError("Only the teacher can accept or reject a request.");
    }
  }

  assertLessonRequestStatusTransition(request.status, parsed.status);

  const { data, error } = await supabase
    .from("lesson_requests")
    .update({ status: parsed.status })
    .eq("id", parsed.requestId)
    .select("*")
    .single();

  if (error) throw error;

  if (
    (parsed.status === "accepted" || parsed.status === "rejected") &&
    request.sender_id !== parsed.actorId
  ) {
    await notifyLessonRequestStatusChange(supabase, {
      recipientId: request.sender_id,
      actorId: parsed.actorId,
      requestId: parsed.requestId,
      status: parsed.status,
    }).catch(() => undefined);
  }

  return data;
}

export async function createLessonRequestMessage(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof createLessonRequestMessageSchema>,
) {
  const parsed = createLessonRequestMessageSchema.parse(input);
  const request = await getLessonRequestById(supabase, parsed.requestId);

  if (!request) {
    throw new DomainForbiddenError("Lesson request not found.");
  }

  if (request.status !== "accepted") {
    throw new DomainForbiddenError("Messages are available only after the teacher accepts the request.");
  }

  const isParticipant =
    request.sender_id === parsed.senderId || request.receiver_id === parsed.senderId;

  if (!isParticipant) {
    throw new DomainForbiddenError("You are not a participant in this request.");
  }

  const { data: sender, error: senderError } = await supabase
    .from("users")
    .select("role")
    .eq("id", parsed.senderId)
    .single();

  if (senderError) throw senderError;

  if (sender.role === "student") {
    throw new DomainForbiddenError("Students cannot send professional messages.", "STUDENT_MESSAGING_BLOCKED");
  }

  return runModeratedSafeTextAction(
    supabase,
    {
      userId: parsed.senderId,
      contentKind: "other",
      text: parsed.content,
    },
    async (content) => {
      const { data, error } = await supabase
        .from("lesson_request_messages")
        .insert({
          request_id: parsed.requestId,
          sender_id: parsed.senderId,
          content,
        })
        .select("*")
        .single();

      if (error) throw error;
      const recipientId =
        request.sender_id === parsed.senderId ? request.receiver_id : request.sender_id;
      await notifyLessonRequestEvent(supabase, {
        recipientId,
        actorId: parsed.senderId,
        requestId: parsed.requestId,
        kind: "lesson_request_message",
      }).catch(() => undefined);
      return data;
    },
  );
}
