import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/profile/feedback/route";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { checkRateLimitAsync } from "@/lib/server/rate-limit";
import { createClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/domain/profiles", () => ({ getCurrentProfile: vi.fn() }));
vi.mock("@/lib/server/rate-limit", () => ({ checkRateLimitAsync: vi.fn() }));

function request(body: unknown) {
  return new Request("http://localhost/api/profile/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/profile/feedback", () => {
  const insert = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentProfile).mockResolvedValue({ id: "u1" } as never);
    vi.mocked(checkRateLimitAsync).mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    insert.mockResolvedValue({ error: null });
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn(() => ({ insert })),
    } as never);
  });

  it("persists feedback in the dedicated queue", async () => {
    const response = await POST(request({
      category: "request",
      subject: "Yeni ders filtresi",
      content: "Dersleri sınıfa göre filtrelemek istiyorum.",
    }));

    expect(response.status).toBe(200);
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: "u1", category: "request" }));
  });

  it("rejects malformed feedback", async () => {
    const response = await POST(request({ category: "request", subject: "x", content: "kısa" }));

    expect(response.status).toBe(400);
    expect(insert).not.toHaveBeenCalled();
  });

  it("enforces the per-user feedback quota", async () => {
    vi.mocked(checkRateLimitAsync).mockResolvedValue({ allowed: false, retryAfterSeconds: 55 });

    const response = await POST(request({
      category: "complaint",
      subject: "Bir hata var",
      content: "Soru ekranında gönder butonu çalışmıyor.",
    }));

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("55");
    expect(insert).not.toHaveBeenCalled();
  });
});
