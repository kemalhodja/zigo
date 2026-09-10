import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/admin/users/grant-plus/route";
import { requirePlatformAdmin } from "@/lib/domain/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

vi.mock("@/lib/domain/admin-auth", () => ({ requirePlatformAdmin: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));

function request(body: unknown) {
  return new Request("http://localhost/api/admin/users/grant-plus", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/users/grant-plus", () => {
  const insert = vi.fn();
  const eq = vi.fn();
  const update = vi.fn();
  const rpc = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    insert.mockResolvedValue({ error: null });
    eq.mockResolvedValue({ error: null });
    update.mockReturnValue({ eq });
    rpc.mockResolvedValue({ error: null });

    const mockAdminDb = {
      from: vi.fn((table: string) => {
        if (table === "admin_billing_grants") return { insert };
        if (table === "users") return { update };
        return { insert, update };
      }),
      rpc,
    };

    vi.mocked(createAdminClient).mockReturnValue(mockAdminDb as never);
    vi.mocked(requirePlatformAdmin).mockResolvedValue({
      profile: { id: "admin-1", role: "teacher" },
      supabase: mockAdminDb as never,
    } as never);
  });

  it("rejects unauthorized calls", async () => {
    vi.mocked(requirePlatformAdmin).mockResolvedValue({
      error: new Response(JSON.stringify({ error: "Yetkisiz" }), { status: 403 }),
      supabase: {} as never,
    } as never);

    const res = await POST(
      request({
        userId: "00000000-0000-4000-8000-000000000101",
        durationDays: 30,
      })
    );

    expect(res.status).toBe(403);
  });

  it("grants Zigo Plus duration and updates users table", async () => {
    const res = await POST(
      request({
        userId: "00000000-0000-4000-8000-000000000101",
        durationDays: 30,
        note: "Hediye",
      })
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(update).toHaveBeenCalledWith({ is_premium: true });
    expect(insert).toHaveBeenCalled();
  });
});
