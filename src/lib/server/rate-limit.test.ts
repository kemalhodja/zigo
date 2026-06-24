import { describe, expect, it } from "vitest";

import { checkRateLimit } from "@/lib/server/rate-limit";

describe("rate-limit", () => {
  it("allows requests under the limit", () => {
    const key = `test-${Date.now()}`;
    const first = checkRateLimit(key, 3, 60_000);
    const second = checkRateLimit(key, 3, 60_000);
    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
  });

  it("blocks requests over the limit", () => {
    const key = `block-${Date.now()}`;
    checkRateLimit(key, 2, 60_000);
    checkRateLimit(key, 2, 60_000);
    const third = checkRateLimit(key, 2, 60_000);
    expect(third.allowed).toBe(false);
    expect(third.retryAfterSeconds).toBeGreaterThan(0);
  });
});
