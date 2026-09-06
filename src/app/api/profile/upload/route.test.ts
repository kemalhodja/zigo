import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/profile/upload/route";
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

function uploadRequest(file: File) {
  const formData = new FormData();
  formData.set("file", file);
  return new Request("http://localhost/api/profile/upload", { method: "POST", body: formData });
}

describe("POST /api/profile/upload", () => {
  const upload = vi.fn();
  const update = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentProfile).mockResolvedValue({ id: "u1" } as never);
    vi.mocked(checkRateLimitAsync).mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    upload.mockResolvedValue({ error: null });
    update.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    vi.mocked(createClient).mockResolvedValue({
      storage: {
        from: vi.fn(() => ({
          upload,
          getPublicUrl: vi.fn(() => ({ data: { publicUrl: "https://cdn.example/avatar.png" } })),
        })),
      },
      from: vi.fn(() => ({ update })),
    } as never);
  });

  it("rejects SVG and arbitrary image MIME types", async () => {
    const response = await POST(uploadRequest(new File(["<svg></svg>"], "avatar.svg", { type: "image/svg+xml" })));

    expect(response.status).toBe(400);
    expect(upload).not.toHaveBeenCalled();
  });

  it("rejects a PNG MIME spoof without a PNG signature", async () => {
    const response = await POST(uploadRequest(new File(["not a png"], "avatar.png", { type: "image/png" })));

    expect(response.status).toBe(400);
    expect(upload).not.toHaveBeenCalled();
  });

  it("returns 429 when the profile upload budget is exhausted", async () => {
    vi.mocked(checkRateLimitAsync).mockResolvedValue({ allowed: false, retryAfterSeconds: 42 });

    const response = await POST(uploadRequest(new File([new Uint8Array([1])], "avatar.png", { type: "image/png" })));

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("42");
    expect(upload).not.toHaveBeenCalled();
  });

  it("uploads a real PNG and updates the profile", async () => {
    const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const response = await POST(uploadRequest(new File([pngHeader], "avatar.png", { type: "image/png" })));

    expect(response.status).toBe(200);
    expect(upload).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledTimes(1);
  });
});
