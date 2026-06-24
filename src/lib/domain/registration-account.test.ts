import { describe, expect, it } from "vitest";

import {
  REGISTRATION_ACCOUNT_OPTIONS,
  resolveRegistrationAccount,
} from "@/lib/domain/registration-account";

describe("registration-account", () => {
  it("exposes five signup account kinds", () => {
    expect(REGISTRATION_ACCOUNT_OPTIONS.map((option) => option.id)).toEqual([
      "student",
      "parent",
      "teacher",
      "institution",
      "platform",
    ]);
  });

  it("maps institution signup to kurumsal billing metadata", () => {
    const institution = resolveRegistrationAccount("institution");
    expect(institution.role).toBe("teacher");
    expect(institution.organizationType).toBe("egitim_kurumu");
  });

  it("maps platform signup to platform billing metadata", () => {
    const platform = resolveRegistrationAccount("platform");
    expect(platform.role).toBe("teacher");
    expect(platform.organizationType).toBe("egitim_platformu");
  });
});
