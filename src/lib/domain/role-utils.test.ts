import { describe, expect, it } from "vitest";

import {
  canPublishSocialContent,
  isPlatformRole,
  isPublisherRole,
  isVerifiedPublisher,
} from "@/lib/domain/role-utils";

describe("role-utils", () => {
  it("treats platform as its own publisher role", () => {
    expect(isPlatformRole("platform")).toBe(true);
    expect(isPlatformRole("teacher")).toBe(false);
    expect(isPublisherRole("platform")).toBe(true);
    expect(isPublisherRole("parent")).toBe(false);
  });

  it("allows verified platform accounts to publish", () => {
    expect(isVerifiedPublisher({ role: "platform", is_verified: true })).toBe(true);
    expect(canPublishSocialContent({ role: "platform", is_verified: false })).toBe(false);
  });
});
