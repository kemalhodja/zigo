import { describe, expect, it } from "vitest";

import {
  REGISTRATION_ACCOUNT_OPTIONS,
  resolvePublisherAccountKind,
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

  it("maps platform signup to dedicated platform role", () => {
    const platform = resolveRegistrationAccount("platform");
    expect(platform.role).toBe("platform");
    expect(platform.organizationType).toBe("egitim_platformu");
  });

  it("resolves publisher account kinds for admin verification", () => {
    expect(resolvePublisherAccountKind({ role: "teacher", organization_type: null })).toBe("teacher");
    expect(
      resolvePublisherAccountKind({ role: "teacher", organization_type: "egitim_kurumu" }),
    ).toBe("institution");
    expect(
      resolvePublisherAccountKind({ role: "teacher", organization_type: "egitim_platformu" }),
    ).toBe("platform");
    expect(resolvePublisherAccountKind({ role: "platform", organization_type: "egitim_platformu" })).toBe(
      "platform",
    );
  });
});
