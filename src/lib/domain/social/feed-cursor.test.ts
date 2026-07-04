import { describe, expect, it } from "vitest";

import { decodeFeedCursor, encodeFeedCursor } from "@/lib/domain/social/feed-cursor";

describe("social feed cursor", () => {
  it("round-trips createdAt and id", () => {
    const cursor = {
      createdAt: "2026-01-01T00:00:00.000Z",
      id: "00000000-0000-4000-8000-000000000601",
    };

    const encoded = encodeFeedCursor(cursor);
    expect(decodeFeedCursor(encoded)).toEqual(cursor);
  });

  it("returns null for invalid cursor payloads", () => {
    expect(decodeFeedCursor("not-a-cursor")).toBeNull();
    expect(decodeFeedCursor(null)).toBeNull();
  });
});
