import { NextResponse } from "next/server";

import {
  handleApiError,
  mapToStandardError,
} from "@/features/shared/errors/global-error-handler";

export type DomainErrorResponse = {
  status: number;
  body: Record<string, unknown>;
};

/** @deprecated Prefer mapToStandardError from @/features/shared */
export function mapDomainError(error: unknown): DomainErrorResponse | null {
  const mapped = mapToStandardError(error, "Request failed.");
  const knownCodes = new Set([
    "RATE_LIMITED",
    "FORBIDDEN",
    "SUBSCRIPTION_REQUIRED",
    "MODERATION_BLOCKED",
    "VALIDATION_ERROR",
  ]);

  if (!knownCodes.has(mapped.body.code)) {
    return null;
  }

  return mapped;
}

/** @deprecated Prefer handleApiError from @/features/shared */
export function respondWithDomainError(error: unknown, fallbackMessage: string, fallbackStatus = 400) {
  const mapped = mapDomainError(error);
  if (mapped) {
    return NextResponse.json(mapped.body, { status: mapped.status });
  }

  return handleApiError(error, fallbackMessage, fallbackStatus);
}

export {
  DomainForbiddenError,
  handleApiError,
  jsonError,
  jsonGone,
  jsonNotFound,
  jsonSuccess,
  jsonSuccessWithMeta,
  mapToStandardError,
  RateLimitExceededError,
} from "@/features/shared/errors/global-error-handler";
