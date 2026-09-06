import { afterEach, describe, expect, it, vi } from "vitest";

import { checkRateLimit, checkRateLimitAsync } from "@/lib/server/rate-limit";

describe("rate-limit", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

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

  it("uses the local limiter outside production when Redis is not configured", async () => {
    vi.stubEnv("NODE_ENV", "test");
    const result = await checkRateLimitAsync(`async-local-${Date.now()}`, 1, 60_000);
    expect(result.allowed).toBe(true);
  });

  it("fails closed in production when the shared Redis limiter is missing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("REDIS_URL", "");
    vi.stubEnv("REDIS_TOKEN", "");
    const result = await checkRateLimitAsync(`async-prod-${Date.now()}`, 10, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("uses the Redis REST pipeline when configured", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("REDIS_URL", "https://redis.example.com");
    vi.stubEnv("REDIS_TOKEN", "token");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(
      JSON.stringify([{ result: 1 }, { result: 1 }, { result: 60 }]),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )));
    const result = await checkRateLimitAsync(`async-redis-${Date.now()}`, 1, 60_000);
    expect(result.allowed).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      "https://redis.example.com/pipeline",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
