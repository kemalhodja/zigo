import { describe, expect, it, vi } from "vitest";

import { DomainForbiddenError } from "@/lib/domain/domain-errors";
import { createLessonRequest, updateLessonRequestStatus } from "@/lib/domain/lesson-requests/mutations";
import { getLessonRequestById } from "@/lib/domain/lesson-requests/queries";

vi.mock("@/lib/domain/moderation-policy", () => ({
  runModeratedSafeTextAction: async (
    _supabase: unknown,
    input: { text: string },
    action: (text: string) => Promise<unknown>,
  ) => action(input.text),
}));

vi.mock("@/lib/domain/lesson-requests/queries", () => ({
  getLessonRequestById: vi.fn(),
}));

vi.mock("@/lib/domain/profiles", () => ({
  getUserInterestAreaIds: vi.fn().mockResolvedValue([1]),
}));

vi.mock("@/features/notifications/services/dispatch.service", () => ({
  notifyLessonRequestCreated: vi.fn().mockResolvedValue(undefined),
  notifyLessonRequestSentConfirmation: vi.fn().mockResolvedValue(undefined),
  notifyLessonRequestStatusChange: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/domain/lesson-requests/notify", () => ({
  notifyLessonRequestEvent: vi.fn().mockResolvedValue(undefined),
}));

const parentId = "11111111-1111-4111-8111-111111111111";
const teacherId = "22222222-2222-4222-8222-222222222222";

function mockSupabase(options: {
  senderRole: "parent" | "student" | "teacher";
  receiverVerified?: boolean;
}) {
  const insert = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: { id: "req-1", message_body: "Merhaba, matematik desteği istiyoruz." },
        error: null,
      }),
    }),
  });

  const from = vi.fn((table: string) => {
    if (table === "users") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockImplementation((_col: string, id: string) => ({
            single: vi.fn().mockResolvedValue({
              data:
                id === parentId
                  ? { role: options.senderRole }
                  : { role: "teacher", is_verified: options.receiverVerified ?? true },
              error: null,
            }),
          })),
        }),
      };
    }

    if (table === "lesson_requests") {
      return {
        insert,
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      };
    }

    if (table === "user_interests") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: [{ area_id: 1 }], error: null }),
          }),
        }),
      };
    }

    return {};
  });

  return {
    from,
    insert,
    rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
  } as unknown as Parameters<typeof createLessonRequest>[0];
}

describe("createLessonRequest", () => {
  it("blocks students from creating lesson requests", async () => {
    const supabase = mockSupabase({ senderRole: "student" });

    await expect(
      createLessonRequest(supabase, {
        senderId: parentId,
        receiverId: teacherId,
        messageBody: "Merhaba, matematik desteği istiyoruz.",
        priority: "normal",
      }),
    ).rejects.toBeInstanceOf(DomainForbiddenError);
  });

  it("allows parents to create requests for verified teachers", async () => {
    const supabase = mockSupabase({ senderRole: "parent", receiverVerified: true });

    const result = await createLessonRequest(supabase, {
      senderId: parentId,
      receiverId: teacherId,
      messageBody: "Merhaba, matematik desteği istiyoruz.",
      priority: "normal",
    });

    expect(result.id).toBe("req-1");
  });
});

describe("updateLessonRequestStatus", () => {
  it("blocks accepting a request that is no longer pending", async () => {
    vi.mocked(getLessonRequestById).mockResolvedValue({
      id: "33333333-3333-4333-8333-333333333333",
      sender_id: parentId,
      receiver_id: teacherId,
      child_profile_id: null,
      area_id: null,
      status: "rejected",
      priority: "normal",
      message_body: "Merhaba",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    await expect(
      updateLessonRequestStatus({} as never, {
        requestId: "33333333-3333-4333-8333-333333333333",
        actorId: teacherId,
        status: "accepted",
      }),
    ).rejects.toBeInstanceOf(DomainForbiddenError);
  });
});
