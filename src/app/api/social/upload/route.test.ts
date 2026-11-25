import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetCurrentProfile,
  mockGetUserSubscription,
  mockCheckRateLimitAsync,
  mockCreateSignedUploadUrl,
  mockStorageUpload,
  mockMediaUploadsInsert,
} = vi.hoisted(() => ({
  mockGetCurrentProfile: vi.fn(),
  mockGetUserSubscription: vi.fn(),
  mockCheckRateLimitAsync: vi.fn(),
  mockCreateSignedUploadUrl: vi.fn(),
  mockStorageUpload: vi.fn(),
  mockMediaUploadsInsert: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    storage: {
      from: () => ({
        createSignedUploadUrl: mockCreateSignedUploadUrl,
        upload: mockStorageUpload,
        remove: vi.fn().mockResolvedValue({ error: null }),
      }),
    },
    from: () => ({
      insert: mockMediaUploadsInsert,
    }),
  }),
}));

vi.mock("@/lib/domain/profiles", () => ({
  getCurrentProfile: (...args: unknown[]) => mockGetCurrentProfile(...args),
}));

vi.mock("@/lib/domain/subscription", () => ({
  getUserSubscription: (...args: unknown[]) => mockGetUserSubscription(...args),
}));

vi.mock("@/lib/server/rate-limit", () => ({
  checkRateLimitAsync: (...args: unknown[]) => mockCheckRateLimitAsync(...args),
}));

import { POST } from "./route";

describe("POST /api/social/upload (short promo video policy)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentProfile.mockResolvedValue({
      id: "teacher-1",
      role: "teacher",
      is_verified: true,
      account_status: "active",
      is_premium: true,
    });
    mockGetUserSubscription.mockResolvedValue({ isPremium: true });
    mockCheckRateLimitAsync.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    mockCreateSignedUploadUrl.mockResolvedValue({
      data: {
        signedUrl: "https://storage.supabase.co/upload/signed/teacher-1/demo.mp4",
        token: "signed-token",
      },
      error: null,
    });
    mockMediaUploadsInsert.mockResolvedValue({ error: null });
  });

  it("issues a signed upload URL for a valid short promo video (<= 30s, <= 25 MB)", async () => {
    const req = new Request("http://localhost:3000/api/social/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "signed-url",
        contentType: "video/mp4",
        fileSize: 14 * 1024 * 1024,
        durationSeconds: 24,
      }),
    });

    const res = await POST(req);
    const json = (await res.json()) as { data?: { signedUrl: string; mediaType: string; objectPath: string } };

    expect(res.status).toBe(200);
    expect(json.data?.mediaType).toBe("video");
    expect(json.data?.signedUrl).toContain("storage.supabase.co");
    expect(json.data?.objectPath).toMatch(/^teacher-1\/.+\.mp4$/);
  });

  it("rejects videos longer than 30 seconds and directs creators to external links", async () => {
    const req = new Request("http://localhost:3000/api/social/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "signed-url",
        contentType: "video/mp4",
        fileSize: 10 * 1024 * 1024,
        durationSeconds: 45,
      }),
    });

    const res = await POST(req);
    const json = (await res.json()) as { error?: string };

    expect(res.status).toBe(400);
    expect(json.error).toContain("30 saniye");
    expect(json.error).toContain("YouTube");
  });

  it("rejects short videos larger than 25 MB", async () => {
    const req = new Request("http://localhost:3000/api/social/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "signed-url",
        contentType: "video/webm",
        fileSize: 30 * 1024 * 1024,
        durationSeconds: 20,
      }),
    });

    const res = await POST(req);
    const json = (await res.json()) as { error?: string };

    expect(res.status).toBe(400);
    expect(json.error).toContain("25 MB");
  });
});
