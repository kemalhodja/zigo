type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitEntry>();

function checkLocalRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000),
    };
  }

  current.count += 1;
  buckets.set(key, current);
  return { allowed: true, retryAfterSeconds: 0 };
}

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  return checkLocalRateLimit(key, limit, windowMs);
}

/**
 * Distributed limiter for serverless deployments. REDIS_URL and REDIS_TOKEN
 * must point to an Upstash-compatible REST endpoint. Production fails closed
 * when the shared limiter is not configured or unavailable.
 */
export async function checkRateLimitAsync(key: string, limit: number, windowMs: number) {
  const redisUrl = process.env.REDIS_URL?.trim().replace(/\/$/, "");
  const redisToken = process.env.REDIS_TOKEN?.trim();
  const isRestRedis = Boolean(redisUrl?.startsWith("https://") && redisToken);

  if (!isRestRedis) {
    if (process.env.NODE_ENV === "production") {
      return { allowed: false, retryAfterSeconds: 60 };
    }
    return checkLocalRateLimit(key, limit, windowMs);
  }

  const redisKey = `zigo:ratelimit:${key}`;
  try {
    const response = await fetch(`${redisUrl}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${redisToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["EXPIRE", redisKey, Math.ceil(windowMs / 1000)],
        ["TTL", redisKey],
      ]),
      signal: AbortSignal.timeout(1500),
    });

    if (!response.ok) throw new Error(`Redis limiter HTTP ${response.status}`);
    const result = (await response.json()) as Array<{ result?: number }>;
    const count = Number(result[0]?.result);
    const ttl = Math.max(1, Number(result[2]?.result) || Math.ceil(windowMs / 1000));
    if (!Number.isFinite(count)) throw new Error("Redis limiter returned an invalid count");
    return {
      allowed: count <= limit,
      retryAfterSeconds: count <= limit ? 0 : ttl,
    };
  } catch (error) {
    console.error("[RATE_LIMIT_REDIS_ERROR]", error);
    if (process.env.NODE_ENV === "production") {
      return { allowed: false, retryAfterSeconds: 60 };
    }
    return checkLocalRateLimit(key, limit, windowMs);
  }
}
