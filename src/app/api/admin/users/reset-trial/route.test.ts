import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/admin/users/reset-trial/route";
import { requirePlatformAdmin } from "@/lib/domain/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

vi.mock("@/lib/domain/admin-auth", () => ({ requirePlatformAdmin: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));

function request(body: unknown) {
  return new Request("http://localhost/api/admin/users/reset-trial", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/users/reset-trial", () => {
  const eq = vi.fn();
  const update = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    eq.mockResolvedValue({ error: null });
    update.mockReturnValue({ eq });

    const mockAdminDb = {
      from: vi.fn(() => ({ update })),
    };

    vi.mocked(createAdminClient).mockReturnValue(mockAdminDb as never);
    vi.mocked(requirePlatformAdmin).mockResolvedValue({
      profile: { id: "admin-1", role: "teacher" },
      supabase: mockAdminDb as never,
    } as never);
  });

  it("resets created_at to grant fresh 7-day trial discount window", async () => {
    const res = await POST(
      request({
        userId: "00000000-0000-4000-8000-000000000101",
      })
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(update).toHaveBeenCalled();
  });
});
