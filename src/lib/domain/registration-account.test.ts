import { describe, expect, it } from "vitest";

import {
  REGISTRATION_ACCOUNT_OPTIONS,
  REGISTRATION_EDUCATION_KIND_IDS,
  REGISTRATION_PRIMARY_GROUPS,
  accountKindFromPrimaryGroup,
  getRegistrationEducationOptions,
  isOrganizationRegistrationType,
  resolveAccountKindFromProfile,
  resolveRegistrationAccount,
  resolveRegistrationPrimaryGroup,
} from "@/lib/domain/registration-account";

describe("registration-account", () => {
  it("exposes eight signup account kinds including kurs and okul", () => {
    expect(REGISTRATION_ACCOUNT_OPTIONS.map((option) => option.id)).toEqual([
      "student",
      "parent",
      "teacher",
      "kurs",
      "okul",
      "institution",
      "platform",
      "publisher",
    ]);
  });

  it("shows four primary groups then education subtypes", () => {
    expect(REGISTRATION_PRIMARY_GROUPS.map((group) => group.id)).toEqual([
      "student",
      "parent",
      "teacher",
      "education",
    ]);
    expect([...REGISTRATION_EDUCATION_KIND_IDS]).toEqual(["kurs", "okul", "platform", "publisher"]);
    expect(getRegistrationEducationOptions().map((option) => option.id)).toEqual([
      "kurs",
      "okul",
      "platform",
      "publisher",
    ]);
    expect(accountKindFromPrimaryGroup("education", "publisher")).toBe("publisher");
    expect(accountKindFromPrimaryGroup("teacher")).toBe("teacher");
    expect(resolveRegistrationPrimaryGroup("okul")).toBe("education");
  });

  it("maps kurs and okul signup to institution billing org types", () => {
    const kurs = resolveRegistrationAccount("kurs");
    expect(kurs.role).toBe("teacher");
    expect(kurs.organizationType).toBe("kurs");

    const okul = resolveRegistrationAccount("okul");
    expect(okul.role).toBe("teacher");
    expect(okul.organizationType).toBe("okul");
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

  it("maps publisher signup to yayınevi billing metadata", () => {
    const publisher = resolveRegistrationAccount("publisher");
    expect(publisher.role).toBe("teacher");
    expect(publisher.organizationType).toBe("yayinevi");
  });

  it("treats all organization types as locked registration orgs", () => {
    expect(isOrganizationRegistrationType("kurs")).toBe(true);
    expect(isOrganizationRegistrationType("okul")).toBe(true);
    expect(isOrganizationRegistrationType("egitim_kurumu")).toBe(true);
    expect(isOrganizationRegistrationType(null)).toBe(false);
  });

  it("reverses stored role and org type to signup account kind", () => {
    expect(resolveAccountKindFromProfile({ role: "student" })).toBe("student");
    expect(resolveAccountKindFromProfile({ role: "parent" })).toBe("parent");
    expect(resolveAccountKindFromProfile({ role: "teacher", organizationType: null })).toBe("teacher");
    expect(resolveAccountKindFromProfile({ role: "teacher", organizationType: "kurs" })).toBe("kurs");
    expect(resolveAccountKindFromProfile({ role: "teacher", organizationType: "yayinevi" })).toBe("publisher");
  });
});
