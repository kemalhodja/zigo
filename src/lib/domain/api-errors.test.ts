import { describe, expect, it } from "vitest";

import { mapDomainError, RateLimitExceededError } from "@/lib/domain/api-errors";
import { DomainForbiddenError } from "@/lib/domain/domain-errors";
import { ModerationRejectedError } from "@/lib/domain/moderation";

describe("mapDomainError", () => {
  it("maps moderation rejection to 422", () => {
    const mapped = mapDomainError(new ModerationRejectedError("profanity", "blocked"));
    expect(mapped?.status).toBe(422);
    expect(mapped?.body.code).toBe("MODERATION_BLOCKED");
  });

  it("maps rate limit to 429 with retryAfterSeconds", () => {
    const mapped = mapDomainError(new RateLimitExceededError("slow down", 12));
    expect(mapped?.status).toBe(429);
    expect(mapped?.body.code).toBe("RATE_LIMITED");
    expect(mapped?.body.retryAfterSeconds).toBe(12);
  });

  it("maps forbidden domain errors to 403", () => {
    const mapped = mapDomainError(new DomainForbiddenError("Only verified teachers can publish posts."));
    expect(mapped?.status).toBe(403);
    expect(mapped?.body.code).toBe("FORBIDDEN");
  });

  it("returns null for unknown errors", () => {
    expect(mapDomainError(new Error("unexpected"))).toBeNull();
  });
});
