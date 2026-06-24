import { describe, expect, it } from "vitest";

import {
  ACTIVE_CHILD_PROFILE_COOKIE,
  readActiveChildProfileId,
} from "@/lib/server/active-child-profile";

describe("active child profile cookie", () => {
  it("reads a valid child profile uuid from cookies", () => {
    const childId = "00000000-0000-4000-8000-000000000401";
    const cookieStore = {
      get: (name: string) =>
        name === ACTIVE_CHILD_PROFILE_COOKIE ? { value: childId } : undefined,
    };

    expect(readActiveChildProfileId(cookieStore as never)).toBe(childId);
  });

  it("rejects invalid cookie values", () => {
    const cookieStore = {
      get: () => ({ value: "not-a-uuid" }),
    };

    expect(readActiveChildProfileId(cookieStore as never)).toBeNull();
  });
});
