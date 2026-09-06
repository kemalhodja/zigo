import { beforeEach, describe, expect, it, vi } from "vitest";

import { PATCH } from "@/app/api/admin/feedback/route";
import { requirePlatformAdmin } from "@/lib/domain/admin-auth";

vi.mock("@/lib/domain/admin-auth", () => ({ requirePlatformAdmin: vi.fn() }));

function request(body: unknown) {
  return new Request("http://localhost/api/admin/feedback", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/admin/feedback", () => {
  const update = vi.fn();
  const eq = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    eq.mockResolvedValue({ error: null });
    update.mockReturnValue({ eq });
    vi.mocked(requirePlatformAdmin).mockResolvedValue({
      profile: { id: "admin-1" },
      supabase: { from: vi.fn(() => ({ update })) },
    } as never);
  });

  it("rejects non-admin callers", async () => {
    vi.mocked(requirePlatformAdmin).mockResolvedValue({
      error: new Response(JSON.stringify({ error: "forbidden" }), { status: 403 }),
      supabase: {} as never,
    } as never);

    const response = await PATCH(request({ feedbackId: "not-an-id", status: "resolved" }));

    expect(response.status).toBe(403);
    expect(update).not.toHaveBeenCalled();
  });

  it("updates status and resolution timestamp for an admin", async () => {
    const response = await PATCH(request({
      feedbackId: "00000000-0000-4000-8000-000000000118",
      status: "resolved",
    }));

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ status: "resolved", resolved_at: expect.any(String) }));
    expect(eq).toHaveBeenCalledWith("id", "00000000-0000-4000-8000-000000000118");
  });

  it("rejects invalid status payloads", async () => {
    const response = await PATCH(request({
      feedbackId: "00000000-0000-4000-8000-000000000118",
      status: "ignored",
    }));

    expect(response.status).toBe(400);
    expect(update).not.toHaveBeenCalled();
  });
});
