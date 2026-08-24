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

export function extractErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string" &&
    (error as { message: string }).message
  ) {
    return (error as { message: string }).message;
  }
  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }
  return fallbackMessage;
}

export function respondWithDomainError(error: unknown, fallbackMessage: string, fallbackStatus = 400) {
  const mapped = mapDomainError(error);
  if (mapped) {
    return NextResponse.json(mapped.body, { status: mapped.status });
  }

  // Expected domain faults were already mapped above; anything reaching this
  // line is an unexpected fault worth tracking in Sentry.
  void import("@sentry/nextjs").then((Sentry) => {
    Sentry.captureException(error, { tags: { handler: "respondWithDomainError" } });
  });

  const message = extractErrorMessage(error, fallbackMessage);
  return NextResponse.json({ error: message }, { status: fallbackStatus });
}

export { DomainForbiddenError, RateLimitExceededError };

