import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/admin/users/notes/route";
import { requirePlatformAdmin } from "@/lib/domain/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

vi.mock("@/lib/domain/admin-auth", () => ({ requirePlatformAdmin: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));

function request(body: unknown) {
  return new Request("http://localhost/api/admin/users/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/users/notes", () => {
  const single = vi.fn();
  const select = vi.fn();
  const insert = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    single.mockResolvedValue({
      data: {
        id: "note-1",
        note: "Veli ile görüşüldü",
        tags: ["VIP"],
      },
      error: null,
    });
    select.mockReturnValue({ single });
    insert.mockReturnValue({ select });

    const mockAdminDb = {
      from: vi.fn(() => ({ insert })),
    };

    vi.mocked(createAdminClient).mockReturnValue(mockAdminDb as never);
    vi.mocked(requirePlatformAdmin).mockResolvedValue({
      profile: { id: "admin-1", role: "teacher" },
      supabase: mockAdminDb as never,
    } as never);
  });

  it("adds internal admin note with tags", async () => {
    const res = await POST(
      request({
        userId: "00000000-0000-4000-8000-000000000101",
        note: "Veli ile görüşüldü",
        tags: ["VIP"],
      })
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.note.note).toBe("Veli ile görüşüldü");
    expect(insert).toHaveBeenCalledWith({
      user_id: "00000000-0000-4000-8000-000000000101",
      admin_id: "admin-1",
      note: "Veli ile görüşüldü",
      tags: ["VIP"],
    });
  });

  it("validates required fields", async () => {
    const res = await POST(
      request({
        userId: "invalid-uuid",
        note: "",
      })
    );

    expect(res.status).toBe(400);
  });
});
