import { getModerationMessage, isModerationRejectedError,ModerationRejectedError } from "@/lib/domain/moderation";
import { isModerationPolicyBlockedError } from "@/lib/domain/moderation-policy";

export function mapModerationError(error: unknown) {
  if (isModerationPolicyBlockedError(error)) {
    return {
      status: 422 as const,
      body: {
        error: error.message,
        code: error.code,
        reason: error.reason,
        strikeCount: error.strikeCount,
        restricted: error.restricted,
        isFirstWarning: error.isFirstWarning,
        contentKind: error.contentKind,
      },
    };
  }

  if (isModerationRejectedError(error)) {
    return {
      status: 422 as const,
      body: {
        error: error.message,
        code: error.code,
        reason: error.reason,
      },
    };
  }

  if (error instanceof Error && error.message.includes("content blocked by moderation policy")) {
    return {
      status: 422 as const,
      body: {
        error: getModerationMessage("profanity"),
        code: "MODERATION_BLOCKED",
        reason: "profanity" as const,
      },
    };
  }

  return null;
}

export { isModerationRejectedError,ModerationRejectedError };
