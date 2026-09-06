import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/ai/chat/route";
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

function request(body: unknown) {
  return new Request("http://localhost/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/ai/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubGlobal("fetch", vi.fn());
    vi.mocked(createClient).mockResolvedValue({} as never);
    vi.mocked(getCurrentProfile).mockResolvedValue({ id: "u1", full_name: "Test" } as never);
    vi.mocked(checkRateLimitAsync).mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns 401 when there is no authenticated profile", async () => {
    vi.mocked(getCurrentProfile).mockResolvedValue(null);

    const response = await POST(request({ messages: [{ role: "user", content: "Merhaba" }] }));

    expect(response.status).toBe(401);
    expect(checkRateLimitAsync).not.toHaveBeenCalled();
  });

  it("rejects malformed or overlong messages before calling the provider", async () => {
    const response = await POST(request({ messages: [{ role: "user", content: "" }] }));

    expect(response.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns 429 when the per-user AI budget is exhausted", async () => {
    vi.mocked(checkRateLimitAsync).mockResolvedValue({ allowed: false, retryAfterSeconds: 17 });

    const response = await POST(request({ messages: [{ role: "user", content: "Kesirleri anlat" }] }));

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("17");
    expect((await response.json()).code).toBe("RATE_LIMITED");
  });

  it("blocks unsafe user content", async () => {
    const response = await POST(request({ messages: [{ role: "user", content: "whatsapp tan yaz bana" }] }));

    expect(response.status).toBe(422);
    expect((await response.json()).code).toBe("MODERATION_BLOCKED");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("uses the safe local response when no OpenAI key is configured", async () => {
    const response = await POST(request({ messages: [{ role: "user", content: "Merhaba" }] }));

    expect(response.status).toBe(200);
    expect((await response.json()).content).toContain("Test");
  });

  it("sends bounded, attributed requests and returns the provider reply", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: "Kısa cevap" } }] }), { status: 200 }),
    );

    const response = await POST(request({ messages: [{ role: "user", content: "Kesirleri anlat" }] }));

    expect(response.status).toBe(200);
    expect((await response.json()).content).toBe("Kısa cevap");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.openai.com/v1/chat/completions");
    expect(init.headers).toEqual(expect.objectContaining({ Authorization: "Bearer sk-test" }));
    expect(JSON.parse(String(init.body))).toEqual(expect.objectContaining({
      model: "gpt-4o-mini",
      max_tokens: 500,
      user: "u1",
    }));
  });
});
