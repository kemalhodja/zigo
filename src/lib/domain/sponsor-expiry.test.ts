import { describe, expect, it } from "vitest";

import {
  isSponsoredExpiringSoon,
  isSponsoredExpiryOpen,
  partitionSponsoredByExpiry,
} from "@/lib/domain/sponsor-expiry";

describe("sponsor-expiry", () => {
  const now = new Date("2026-07-23T12:00:00.000Z");

  it("treats missing expiry as still open", () => {
    expect(isSponsoredExpiryOpen(null, now)).toBe(true);
    expect(isSponsoredExpiringSoon(null, now)).toBe(false);
  });

  it("detects open, expired, and soon windows", () => {
    expect(isSponsoredExpiryOpen("2026-07-24T12:00:00.000Z", now)).toBe(true);
    expect(isSponsoredExpiryOpen("2026-07-23T11:00:00.000Z", now)).toBe(false);
    expect(isSponsoredExpiringSoon("2026-07-25T12:00:00.000Z", now)).toBe(true);
    expect(isSponsoredExpiringSoon("2026-08-01T12:00:00.000Z", now)).toBe(false);
  });

  it("partitions active rows by expiry", () => {
    const { active, expired, expiringSoon } = partitionSponsoredByExpiry(
      [
        { id: "1", sponsored_status: "active", sponsored_expires_at: "2026-07-24T12:00:00.000Z" },
        { id: "2", sponsored_status: "active", sponsored_expires_at: "2026-07-20T12:00:00.000Z" },
        { id: "3", sponsored_status: "paused", sponsored_expires_at: "2026-07-24T12:00:00.000Z" },
        { id: "4", sponsored_status: "active", sponsored_expires_at: "2026-08-10T12:00:00.000Z" },
        { id: "5", sponsored_status: "active", sponsored_expires_at: null },
      ],
      now,
    );

    expect(active.map((row) => row.id)).toEqual(["1", "4", "5"]);
    expect(expired.map((row) => row.id)).toEqual(["2"]);
    expect(expiringSoon.map((row) => row.id)).toEqual(["1"]);
  });
});
