import { describe, expect, it } from "vitest";

import {
  isIndexableCreatorRole,
  isIndexablePost,
  isIndexableProfile,
} from "./seo-indexing";

describe("seo-indexing", () => {
  it("recognizes creator roles and excludes student and parent roles", () => {
    expect(isIndexableCreatorRole("teacher")).toBe(true);
    expect(isIndexableCreatorRole("education_institution")).toBe(true);
    expect(isIndexableCreatorRole("education_platform")).toBe(true);
    expect(isIndexableCreatorRole("publisher")).toBe(true);
    expect(isIndexableCreatorRole("platform")).toBe(true);

    expect(isIndexableCreatorRole("student")).toBe(false);
    expect(isIndexableCreatorRole("parent")).toBe(false);
    expect(isIndexableCreatorRole(null)).toBe(false);
    expect(isIndexableCreatorRole(undefined)).toBe(false);
  });

  it("allows public creator profiles and blocks student, parent, and private profiles", () => {
    expect(isIndexableProfile({ role: "teacher", is_private: false })).toBe(true);
    expect(isIndexableProfile({ role: "publisher", is_private: null })).toBe(true);
    expect(isIndexableProfile({ role: "teacher" })).toBe(true);

    expect(isIndexableProfile({ role: "teacher", is_private: true })).toBe(false);
    expect(isIndexableProfile({ role: "student", is_private: false })).toBe(false);
    expect(isIndexableProfile({ role: "parent", is_private: false })).toBe(false);
  });

  it("allows discoverable public creator posts and blocks restricted or student/parent posts", () => {
    expect(
      isIndexablePost({
        followers_only: false,
        is_discoverable: true,
        author: { role: "teacher" },
      }),
    ).toBe(true);

    expect(
      isIndexablePost({
        followers_only: false,
        is_discoverable: true,
        author: { role: "publisher" },
      }),
    ).toBe(true);

    expect(
      isIndexablePost({
        followers_only: true,
        is_discoverable: true,
        author: { role: "teacher" },
      }),
    ).toBe(false);

    expect(
      isIndexablePost({
        followers_only: false,
        is_discoverable: false,
        author: { role: "teacher" },
      }),
    ).toBe(false);

    expect(
      isIndexablePost({
        followers_only: false,
        is_discoverable: true,
        author: { role: "student" },
      }),
    ).toBe(false);

    expect(
      isIndexablePost({
        followers_only: false,
        is_discoverable: true,
        author: { role: "parent" },
      }),
    ).toBe(false);
  });
});
