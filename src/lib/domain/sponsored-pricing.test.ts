import { describe, expect, it } from "vitest";

import {
  formatSponsorPriceTry,
  getSponsorPricingOptions,
  resolveSponsorCategory,
} from "@/lib/domain/sponsored-pricing";

describe("sponsored-pricing", () => {
  it("resolves exact pricing for educational platforms (2500 TL weekly / 8000 TL monthly)", () => {
    const profile = { role: "teacher", organization_type: "egitim_platformu" };
    expect(resolveSponsorCategory(profile)).toBe("platform");

    const options = getSponsorPricingOptions(profile);
    expect(options).toHaveLength(2);

    const weekly = options.find((opt) => opt.days === 7);
    const monthly = options.find((opt) => opt.days === 30);

    expect(weekly?.priceTry).toBe(2500);
    expect(monthly?.priceTry).toBe(8000);
  });

  it("resolves exact pricing for educational institutions (3000 TL weekly / 10000 TL monthly)", () => {
    for (const orgType of ["kurs", "okul", "egitim_kurumu"]) {
      const profile = { role: "teacher", organization_type: orgType };
      expect(resolveSponsorCategory(profile)).toBe("institution");

      const options = getSponsorPricingOptions(profile);
      expect(options).toHaveLength(2);

      const weekly = options.find((opt) => opt.days === 7);
      const monthly = options.find((opt) => opt.days === 30);

      expect(weekly?.priceTry).toBe(3000);
      expect(monthly?.priceTry).toBe(10000);
    }
  });

  it("resolves default pricing for individual teachers without institution type (1000 TL weekly / 3000 TL monthly)", () => {
    const profile = { role: "teacher", organization_type: null };
    expect(resolveSponsorCategory(profile)).toBe("teacher");

    const options = getSponsorPricingOptions(profile);
    expect(options).toHaveLength(2);

    const weekly = options.find((opt) => opt.days === 7);
    const monthly = options.find((opt) => opt.days === 30);

    expect(weekly?.priceTry).toBe(1000);
    expect(monthly?.priceTry).toBe(3000);
  });

  it("formats TRY currency string properly", () => {
    expect(formatSponsorPriceTry(2500)).toContain("2.500");
    expect(formatSponsorPriceTry(10000)).toContain("10.000");
  });
});
