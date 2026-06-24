import { describe, expect, it } from "vitest";

import {
  canViewerOpenSponsoredAd,
  isSponsoredAdActive,
  isSponsoredAdConfigured,
} from "@/lib/domain/sponsored-ads";
import type { SocialPostRow } from "@/lib/supabase/database.types";

const basePost = {
  sponsored_label: "Kitap indirimi",
  sponsored_target_url: "https://example.com/ad",
  sponsored_status: "active" as const,
  sponsored_expires_at: new Date(Date.now() + 86_400_000).toISOString(),
} satisfies Pick<
  SocialPostRow,
  "sponsored_label" | "sponsored_target_url" | "sponsored_status" | "sponsored_expires_at"
>;

describe("sponsored-ads", () => {
  it("detects configured sponsored posts", () => {
    expect(isSponsoredAdConfigured(basePost)).toBe(true);
    expect(isSponsoredAdConfigured({ ...basePost, sponsored_target_url: null })).toBe(false);
  });

  it("checks active lifecycle", () => {
    expect(isSponsoredAdActive(basePost)).toBe(true);
    expect(isSponsoredAdActive({ ...basePost, sponsored_status: "paused" })).toBe(false);
    expect(
      isSponsoredAdActive({
        ...basePost,
        sponsored_expires_at: new Date(Date.now() - 86_400_000).toISOString(),
      }),
    ).toBe(false);
  });

  it("allows authenticated viewers to open active ads", () => {
    expect(canViewerOpenSponsoredAd("user-1", basePost as SocialPostRow)).toBe(true);
    expect(canViewerOpenSponsoredAd(undefined, basePost as SocialPostRow)).toBe(false);
  });
});
