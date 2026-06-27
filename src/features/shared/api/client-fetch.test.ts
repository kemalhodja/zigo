import { describe, expect, it, vi } from "vitest";

import { ApiClientError, fetchJson } from "@/features/shared/api/client-fetch";

describe("fetchJson", () => {
  it("throws ApiClientError with code on failed responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: "Forbidden", code: "FORBIDDEN" }),
      }),
    );

    await expect(fetchJson("/api/test")).rejects.toMatchObject({
      message: "Forbidden",
      status: 403,
      code: "FORBIDDEN",
    } satisfies Partial<ApiClientError>);

    vi.unstubAllGlobals();
  });

  it("returns parsed json on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: [{ id: "b1" }] }),
      }),
    );

    await expect(fetchJson<{ data: { id: string }[] }>("/api/test")).resolves.toEqual({
      data: [{ id: "b1" }],
    });

    vi.unstubAllGlobals();
  });
});
