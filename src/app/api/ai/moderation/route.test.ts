import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/ai/moderation/route";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { checkRateLimitAsync } from "@/lib/server/rate-limit";
import { createClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/domain/profiles", () => ({
  getCurrentProfile: vi.fn(),
}));

vi.mock("@/lib/server/rate-limit", () => ({
  checkRateLimitAsync: vi.fn(),
}));

function makeReq(body: unknown) {
  return new Request("http://localhost/api/ai/moderation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/ai/moderation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.mocked(createClient).mockResolvedValue({} as never);
    vi.mocked(getCurrentProfile).mockResolvedValue({ id: "u1", full_name: "Test" } as never);
    vi.mocked(checkRateLimitAsync).mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects unauthenticated requests with 401", async () => {
    vi.mocked(getCurrentProfile).mockResolvedValue(null);
    const res = await POST(makeReq({ text: "Merhaba" }));
    expect(res.status).toBe(401);
    expect(checkRateLimitAsync).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limited", async () => {
    vi.mocked(checkRateLimitAsync).mockResolvedValue({ allowed: false, retryAfterSeconds: 42 });
    const res = await POST(makeReq({ text: "Merhaba" }));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("42");
  });

  it("rejects overlong text payloads with 400", async () => {
    const res = await POST(makeReq({ text: "a".repeat(5_001) }));
    expect(res.status).toBe(400);
  });

  it("returns safe fallback when OPENAI_API_KEY is absent", async () => {
    const res = await POST(makeReq({ text: "Normal bir soru" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ safe: true, provider: "none" });
  });
});
