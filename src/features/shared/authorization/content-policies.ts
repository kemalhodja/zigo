import { evaluateCapability } from "./capabilities";
import type { AuthContext, AuthzDecision } from "./types";

export function assertAreaInUserInterests(areaIds: readonly number[], areaId: number): AuthzDecision {
  if (!areaIds.includes(areaId)) {
    return {
      allowed: false,
      message: "This education area is not in your selected interests.",
      code: "FORBIDDEN",
    };
  }

  return { allowed: true };
}

export function canReadMatchedFeed(ctx: AuthContext): AuthzDecision {
  return evaluateCapability(ctx, "feed:read_matched");
}

export function canCreatePost(ctx: AuthContext, areaId: number): AuthzDecision {
  const capability = evaluateCapability(ctx, "post:create");
  if (!capability.allowed) return capability;
  return assertAreaInUserInterests(ctx.areaIds, areaId);
}

export function canAskQuestion(ctx: AuthContext, areaId: number): AuthzDecision {
  const capability = evaluateCapability(ctx, "question:create");
  if (!capability.allowed) return capability;
  return assertAreaInUserInterests(ctx.areaIds, areaId);
}

export function canAnswerQuestion(ctx: AuthContext, questionAreaId: number | null): AuthzDecision {
  const capability = evaluateCapability(ctx, "answer:create");
  if (!capability.allowed) return capability;

  if (questionAreaId == null) {
    return {
      allowed: false,
      message: "Question education area is required.",
      code: "FORBIDDEN",
    };
  }

  return assertAreaInUserInterests(ctx.areaIds, questionAreaId);
}

export function canAccessLearn(ctx: AuthContext): AuthzDecision {
  return evaluateCapability(ctx, "learn:access");
}

export function canCreateLessonRequest(ctx: AuthContext): AuthzDecision {
  return evaluateCapability(ctx, "lesson_request:create");
}

/** Students must never send direct messages — social DM capability is absent by design. */
export function canStudentSendDirectMessage(): AuthzDecision {
  return {
    allowed: false,
    message: "Student direct messaging is not allowed.",
    code: "FORBIDDEN",
  };
}
