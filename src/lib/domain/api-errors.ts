import { NextResponse } from "next/server";

import {
  DomainForbiddenError,
  isDomainForbiddenError,
  isRateLimitExceededError,
  isSubscriptionRequiredError,
  RateLimitExceededError,
} from "@/lib/domain/domain-errors";
import { mapModerationError } from "@/lib/domain/moderation-http";

export type DomainErrorResponse = {
  status: number;
  body: Record<string, unknown>;
};

export function mapDomainError(error: unknown): DomainErrorResponse | null {
  const moderation = mapModerationError(error);
  if (moderation) {
    return { status: moderation.status, body: moderation.body };
  }

  if (isRateLimitExceededError(error)) {
    return {
      status: 429,
      body: {
        error: error.message,
        code: "RATE_LIMITED",
        retryAfterSeconds: error.retryAfterSeconds,
      },
    };
  }

  if (isDomainForbiddenError(error)) {
    return {
      status: 403,
      body: {
        error: error.message,
        code: error.code,
      },
    };
  }

  if (isSubscriptionRequiredError(error)) {
    return {
      status: 402,
      body: {
        error: error.message,
        code: error.code,
      },
    };
  }

  return null;
}

export function respondWithDomainError(error: unknown, fallbackMessage: string, fallbackStatus = 400) {
  const mapped = mapDomainError(error);
  if (mapped) {
    return NextResponse.json(mapped.body, { status: mapped.status });
  }

  const message = error instanceof Error ? error.message : fallbackMessage;
  return NextResponse.json({ error: message }, { status: fallbackStatus });
}

export { DomainForbiddenError, RateLimitExceededError };
