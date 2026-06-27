import { describe, expect, it } from "vitest";
import { z,type ZodError } from "zod";

import {
  handleApiError,
  jsonError,
  mapToStandardError,
  RateLimitExceededError,
} from "@/features/shared/errors/global-error-handler";
import { DomainForbiddenError } from "@/lib/domain/domain-errors";
import { ModerationRejectedError } from "@/lib/domain/moderation";

describe("mapToStandardError", () => {
  it("maps moderation rejection to 422", () => {
    const mapped = mapToStandardError(new ModerationRejectedError("profanity", "blocked"));
    expect(mapped.status).toBe(422);
    expect(mapped.body.code).toBe("MODERATION_BLOCKED");
  });

  it("maps rate limit to 429 with retryAfterSeconds", () => {
    const mapped = mapToStandardError(new RateLimitExceededError("slow down", 12));
    expect(mapped.status).toBe(429);
    expect(mapped.body.code).toBe("RATE_LIMITED");
    expect(mapped.body.retryAfterSeconds).toBe(12);
  });

  it("maps forbidden domain errors to 403", () => {
    const mapped = mapToStandardError(new DomainForbiddenError("Only verified teachers can publish posts."));
    expect(mapped.status).toBe(403);
    expect(mapped.body.code).toBe("FORBIDDEN");
  });

  it("maps zod validation errors to 400", () => {
    const schema = z.object({ slotId: z.string().uuid() });
    let zodError: ZodError | null = null;
    try {
      schema.parse({ slotId: "not-a-uuid" });
    } catch (error) {
      zodError = error as ZodError;
    }

    const mapped = mapToStandardError(zodError);
    expect(mapped.status).toBe(400);
    expect(mapped.body.code).toBe("VALIDATION_ERROR");
  });

  it("maps unknown errors to fallback status and BAD_REQUEST", () => {
    const mapped = mapToStandardError(new Error("unexpected"), "Fallback", 400);
    expect(mapped.status).toBe(400);
    expect(mapped.body.error).toBe("unexpected");
    expect(mapped.body.code).toBe("BAD_REQUEST");
  });
});

describe("handleApiError", () => {
  it("returns standardized json body", async () => {
    const response = handleApiError(new DomainForbiddenError("Denied"), "Fallback", 400);
    expect(response.status).toBe(403);
    const body = (await response.json()) as { error: string; code: string };
    expect(body.error).toBe("Denied");
    expect(body.code).toBe("FORBIDDEN");
  });
});

describe("jsonError", () => {
  it("returns unauthorized payload", async () => {
    const response = jsonError("Unauthorized", 401);
    expect(response.status).toBe(401);
    const body = (await response.json()) as { error: string; code: string };
    expect(body.code).toBe("UNAUTHORIZED");
  });
});
