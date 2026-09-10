import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/admin/users/update/route";
import { requirePlatformAdmin } from "@/lib/domain/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

vi.mock("@/lib/domain/admin-auth", () => ({ requirePlatformAdmin: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));

function request(body: unknown) {
  return new Request("http://localhost/api/admin/users/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/users/update", () => {
  const single = vi.fn();
  const select = vi.fn();
  const eq = vi.fn();
  const update = vi.fn();
  const rpc = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    single.mockResolvedValue({ data: { id: "00000000-0000-4000-8000-000000000101" }, error: null });
    select.mockReturnValue({ single });
    eq.mockReturnValue({ select });
    update.mockReturnValue({ eq });
    rpc.mockResolvedValue({ error: null });

    const mockAdminDb = {
      from: vi.fn(() => ({ update })),
      rpc,
    };

    vi.mocked(createAdminClient).mockReturnValue(mockAdminDb as never);
    vi.mocked(requirePlatformAdmin).mockResolvedValue({
      profile: { id: "admin-1", role: "teacher" },
      supabase: mockAdminDb as never,
    } as never);
  });

  it("rejects non-admin callers with 403", async () => {
    vi.mocked(requirePlatformAdmin).mockResolvedValue({
      error: new Response(JSON.stringify({ error: "Yetkisiz erişim." }), { status: 403 }),
      supabase: {} as never,
    } as never);

    const response = await POST(
      request({
        userId: "00000000-0000-4000-8000-000000000101",
        isVerified: true,
      }),
    );

    expect(response.status).toBe(403);
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects invalid payload (e.g. invalid role)", async () => {
    const response = await POST(
      request({
        userId: "00000000-0000-4000-8000-000000000101",
        role: "superman",
      }),
    );

    expect(response.status).toBe(400);
    expect(update).not.toHaveBeenCalled();
  });

  it("successfully updates user properties and invokes RPC when isPremium changes", async () => {
    const response = await POST(
      request({
        userId: "00000000-0000-4000-8000-000000000101",
        role: "teacher",
        isVerified: true,
        isPremium: true,
        accountStatus: "active",
        teacherCreatorPlus: true,
        moderationStrikes: 0,
        socialInteractionsBlocked: false,
      }),
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "teacher",
        is_verified: true,
        is_premium: true,
        account_status: "active",
        teacher_creator_plus: true,
        social_safety_strike_count: 0,
        social_interactions_blocked: false,
      }),
    );
    expect(eq).toHaveBeenCalledWith("id", "00000000-0000-4000-8000-000000000101");
    expect(rpc).toHaveBeenCalledWith(
      "set_user_subscription_tier",
      expect.objectContaining({
        p_user_id: "00000000-0000-4000-8000-000000000101",
        p_tier: "zigo_plus",
      }),
    );
  });
});
