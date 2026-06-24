export class DomainForbiddenError extends Error {
  readonly code: string;

  constructor(message: string, code = "FORBIDDEN") {
    super(message);
    this.name = "DomainForbiddenError";
    this.code = code;
  }
}

export class RateLimitExceededError extends Error {
  readonly retryAfterSeconds: number;

  constructor(message: string, retryAfterSeconds: number) {
    super(message);
    this.name = "RateLimitExceededError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class SubscriptionRequiredError extends Error {
  readonly code = "SUBSCRIPTION_REQUIRED";

  constructor(message: string) {
    super(message);
    this.name = "SubscriptionRequiredError";
  }
}

export function isDomainForbiddenError(error: unknown): error is DomainForbiddenError {
  return error instanceof DomainForbiddenError;
}

export function isRateLimitExceededError(error: unknown): error is RateLimitExceededError {
  return error instanceof RateLimitExceededError;
}

export function isSubscriptionRequiredError(error: unknown): error is SubscriptionRequiredError {
  return error instanceof SubscriptionRequiredError;
}
