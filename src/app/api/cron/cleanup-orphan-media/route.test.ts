import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRemove, mockMediaUploadsQuery, mockPostsSelect, mockStoriesSelect, mockUpdateIn } =
  vi.hoisted(() => ({
    mockRemove: vi.fn(),
    mockMediaUploadsQuery: vi.fn(),
    mockPostsSelect: vi.fn(),
    mockStoriesSelect: vi.fn(),
    mockUpdateIn: vi.fn(),
  }));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    storage: {
      from: () => ({
        remove: mockRemove,
      }),
    },
    from: (table: string) => {
      if (table === "media_uploads") {
        return {
          select: () => ({
            is: () => ({
              lt: () => ({
                order: () => ({
                  limit: mockMediaUploadsQuery,
                }),
              }),
            }),
          }),
          update: () => ({
            in: mockUpdateIn,
          }),
        };
      }
      if (table === "social_posts") {
        return {
          select: () => ({
            not: () => ({
              limit: mockPostsSelect,
            }),
          }),
        };
      }
      return {
        select: () => ({
          not: () => ({
            limit: mockStoriesSelect,
          }),
        }),
      };
    },
  }),
}));

import { GET } from "./route";

describe("GET /api/cron/cleanup-orphan-media", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-cron-secret";
    mockRemove.mockResolvedValue({ error: null });
    mockUpdateIn.mockResolvedValue({ error: null });
  });

  it("rejects unauthorized requests without valid Bearer CRON_SECRET", async () => {
    const req = new Request("http://localhost:3000/api/cron/cleanup-orphan-media", {
      headers: { authorization: "Bearer wrong-secret" },
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("deletes unreferenced orphan uploads while preserving active video & poster files", async () => {
    mockMediaUploadsQuery.mockResolvedValue({
      data: [
        { id: "1", object_path: "u1/active-video.mp4", byte_size: 12_000_000, created_at: "2026-01-01T00:00:00Z" },
        { id: "2", object_path: "u1/active-poster.webp", byte_size: 40_000, created_at: "2026-01-01T00:00:00Z" },
        { id: "3", object_path: "u1/abandoned-upload.mp4", byte_size: 18_000_000, created_at: "2026-01-01T00:00:00Z" },
      ],
      error: null,
    });
    mockPostsSelect.mockResolvedValue({
      data: [
        {
          media_url: `/api/social/media?path=${encodeURIComponent("u1/active-video.mp4")}&poster=${encodeURIComponent("u1/active-poster.webp")}`,
        },
      ],
      error: null,
    });
    mockStoriesSelect.mockResolvedValue({ data: [], error: null });

    const req = new Request("http://localhost:3000/api/cron/cleanup-orphan-media", {
      headers: { authorization: "Bearer test-cron-secret" },
    });

    const res = await GET(req);
    const json = (await res.json()) as { ok: boolean; scanned: number; deleted: number; freedBytes: number };

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.scanned).toBe(3);
    expect(json.deleted).toBe(1);
    expect(json.freedBytes).toBe(18_000_000);
    expect(mockRemove).toHaveBeenCalledWith(["u1/abandoned-upload.mp4"]);
    expect(mockUpdateIn).toHaveBeenCalledWith("id", ["3"]);
  });
});
