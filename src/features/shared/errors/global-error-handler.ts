import { NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  DomainForbiddenError,
  isDomainForbiddenError,
  isRateLimitExceededError,
  isSubscriptionRequiredError,
  RateLimitExceededError,
} from "@/lib/domain/domain-errors";
import { mapModerationError } from "@/lib/domain/moderation-http";

import type { StandardErrorBody, StandardErrorResult } from "./types";

export function mapToStandardError(
  error: unknown,
  fallbackMessage = "Request failed.",
  fallbackStatus = 400,
): StandardErrorResult {
  const moderation = mapModerationError(error);
  if (moderation) {
    return {
      status: moderation.status,
      body: {
        error: String(moderation.body.error ?? fallbackMessage),
        code: String(moderation.body.code ?? "MODERATION_BLOCKED"),
      },
    };
  }

  if (error instanceof ZodError) {
    return {
      status: 400,
      body: {
        error: "Validation failed.",
        code: "VALIDATION_ERROR",
        details: error.flatten(),
      },
    };
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

  const message = error instanceof Error ? error.message : fallbackMessage;
  return {
    status: fallbackStatus,
    body: {
      error: message,
      code: fallbackStatus >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST",
    },
  };
}

export function handleApiError(
  error: unknown,
  fallbackMessage = "Request failed.",
  fallbackStatus = 400,
): NextResponse<StandardErrorBody> {
  const mapped = mapToStandardError(error, fallbackMessage, fallbackStatus);
  return NextResponse.json(mapped.body, { status: mapped.status });
}

export function jsonError(
  message: string,
  status: number,
  code: StandardErrorBody["code"] = status === 401 ? "UNAUTHORIZED" : status === 403 ? "FORBIDDEN" : "BAD_REQUEST",
): NextResponse<StandardErrorBody> {
  return NextResponse.json({ error: message, code }, { status });
}

export function jsonSuccess<T>(data: T, status = 200): NextResponse<{ data: T }> {
  return NextResponse.json({ data }, { status });
}

export function jsonNotFound(message = "Not found"): NextResponse<StandardErrorBody> {
  return jsonError(message, 404, "NOT_FOUND");
}

export function jsonSuccessWithMeta<T, M extends Record<string, unknown>>(
  data: T,
  meta: M,
  status = 200,
): NextResponse<{ data: T; meta: M }> {
  return NextResponse.json({ data, meta }, { status });
}

export function jsonGone(message: string, code = "GONE"): NextResponse<StandardErrorBody> {
  return jsonError(message, 410, code);
}

export { DomainForbiddenError, RateLimitExceededError };
