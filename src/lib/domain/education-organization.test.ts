import { describe, expect, it } from "vitest";

import {
  EDUCATION_ORGANIZATION_OPTIONS,
  resolveOrganizationBillingTier,
} from "@/lib/domain/education-organization";

describe("education-organization", () => {
  it("maps kurs and okul to institution billing", () => {
    expect(resolveOrganizationBillingTier("kurs")).toBe("institution");
    expect(resolveOrganizationBillingTier("okul")).toBe("institution");
    expect(resolveOrganizationBillingTier("egitim_kurumu")).toBe("institution");
  });

  it("maps egitim platformu to platform billing", () => {
    expect(resolveOrganizationBillingTier("egitim_platformu")).toBe("platform");
  });

  it("exposes four organization options", () => {
    expect(EDUCATION_ORGANIZATION_OPTIONS.map((option) => option.id)).toEqual([
      "kurs",
      "okul",
      "egitim_kurumu",
      "egitim_platformu",
    ]);
  });
});
