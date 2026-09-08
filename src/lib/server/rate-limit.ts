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
 * Upstash REST API yanıtlarından güvenli tamsayı çıkarır.
 * NaN, null, undefined veya beklenmedik tiplerde fallback değeri döner.
 */
function toSafeInt(v: unknown, fallback: number): number {
  if (typeof v === "number" && Number.isFinite(v) && !Number.isNaN(v)) return Math.round(v);
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n) && !Number.isNaN(n)) return Math.round(n);
  }
  if (v !== null && typeof v === "object") {
    if ("result" in v) {
      const n = Number((v as Record<string, unknown>).result);
      if (Number.isFinite(n) && !Number.isNaN(n)) return Math.round(n);
    }
    if ("integer" in v) {
      const n = Number((v as Record<string, unknown>).integer);
      if (Number.isFinite(n) && !Number.isNaN(n)) return Math.round(n);
    }
  }
  return fallback;
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
      return { allowed: false, retryAfterSeconds: Math.ceil(windowMs / 1000) };
    }
    return checkLocalRateLimit(key, limit, windowMs);
  }

  const redisKey = `zigo:ratelimit:${key}`;
  const windowSec = Math.ceil(windowMs / 1000);

  // Pipeline ile tek istekte INCR + EXPIRE + TTL
  try {
    const pipelineRes = await fetch(`${redisUrl}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${redisToken}`, "Content-Type": "application/json" },
      body: JSON.stringify([["INCR", redisKey], ["EXPIRE", redisKey, windowSec], ["TTL", redisKey]]),
      signal: AbortSignal.timeout(1500),
    });

    if (pipelineRes.ok) {
      const raw = await pipelineRes.json();
      const arr = Array.isArray(raw) ? raw : [];

      const count = toSafeInt(arr[0], -1);
      if (count < 0) {
        // Geçersiz yanıt — yerel limiter'a düş
        console.warn("[RATE_LIMIT_PIPELINE_WARN] Invalid count from pipeline, falling back to local limiter");
        return checkLocalRateLimit(key, limit, windowMs);
      }

      const ttl = Math.max(1, toSafeInt(arr[2], windowSec));
      return { allowed: count <= limit, retryAfterSeconds: count <= limit ? 0 : ttl };
    }
  } catch (e) {
    console.error("[RATE_LIMIT_PIPELINE_ERROR]", e);
  }

  // Fallback: tekil komutlar
  try {
    const incrRes = await fetch(`${redisUrl}/incr/${encodeURIComponent(redisKey)}`, {
      headers: { Authorization: `Bearer ${redisToken}` },
      signal: AbortSignal.timeout(1500),
    });
    if (!incrRes.ok) throw new Error(`INCR HTTP ${incrRes.status}`);

    const incrData = await incrRes.json();
    const count = toSafeInt(incrData?.result ?? incrData?.integer ?? incrData, -1);

    if (count < 0) {
      // Redis geçersiz veri döndürdü — yerel limiter'a düş, hata fırlatma
      console.warn("[RATE_LIMIT_REDIS_WARN] Invalid count from Redis, falling back to local limiter");
      return checkLocalRateLimit(key, limit, windowMs);
    }

    await fetch(`${redisUrl}/expire/${encodeURIComponent(redisKey)}/${windowSec}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${redisToken}` },
      signal: AbortSignal.timeout(1500),
    });

    const ttlRes = await fetch(`${redisUrl}/ttl/${encodeURIComponent(redisKey)}`, {
      headers: { Authorization: `Bearer ${redisToken}` },
      signal: AbortSignal.timeout(1500),
    });

    let ttl = windowSec;
    if (ttlRes.ok) {
      const ttlData = await ttlRes.json();
      const parsed = toSafeInt(ttlData?.result ?? ttlData?.integer ?? ttlData, -1);
      if (parsed > 0) ttl = parsed;
    }

    return { allowed: count <= limit, retryAfterSeconds: count <= limit ? 0 : ttl };
  } catch (error) {
    console.error("[RATE_LIMIT_REDIS_ERROR]", error);
    if (process.env.NODE_ENV === "production") {
      return { allowed: false, retryAfterSeconds: windowSec };
    }
    return checkLocalRateLimit(key, limit, windowMs);
  }
}
