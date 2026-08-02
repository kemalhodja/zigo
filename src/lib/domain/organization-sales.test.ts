import { describe, expect, it } from "vitest";

import { buildFamilyEntitlementSummary } from "@/lib/domain/family-entitlement";
import {
  buildOrganizationSalesInquiryMessage,
  buildSponsorSalesInquiryMessage,
  isSalesAssistedPlanId,
  shouldBlockSelfServeOrgCheckout,
  shouldBlockSelfServeSponsorCheckout,
  shouldHideOrganizationSponsorPrices,
} from "@/lib/domain/organization-sales";

describe("organization-sales", () => {
  it("flags institution/platform/publisher plan ids as sales-assisted", () => {
    expect(isSalesAssistedPlanId("institution-yearly")).toBe(true);
    expect(isSalesAssistedPlanId("platform-monthly")).toBe(true);
    expect(isSalesAssistedPlanId("publisher-semiannual")).toBe(true);
    expect(isSalesAssistedPlanId("teacher-monthly")).toBe(false);
    expect(isSalesAssistedPlanId("family-monthly")).toBe(false);
  });

  it("blocks self-serve checkout for org accounts on any plan id", () => {
    expect(shouldBlockSelfServeOrgCheckout("kurs", "institution-monthly")).toBe(false);
    expect(shouldBlockSelfServeOrgCheckout("yayinevi", "publisher-yearly")).toBe(false);
    expect(shouldBlockSelfServeOrgCheckout("kurs", "teacher-monthly")).toBe(false);
    expect(shouldBlockSelfServeOrgCheckout(null, "institution-monthly")).toBe(false);
    expect(shouldBlockSelfServeOrgCheckout(null, "teacher-monthly")).toBe(false);
  });

  it("builds a sales inquiry message", () => {
    const message = buildOrganizationSalesInquiryMessage({
      organizationType: "kurs",
      organizationName: "Zigo Kurs",
      planTitle: "Eğitim Kurumu Aboneliği",
    });
    expect(message).toContain("Zigo Kurs");
    expect(message).toContain("Kurs");
    expect(message).toContain("Eğitim Kurumu Aboneliği");
  });

  it("blocks self-serve sponsor checkout and hides prices for org accounts", () => {
    expect(shouldBlockSelfServeSponsorCheckout("kurs")).toBe(false);
    expect(shouldBlockSelfServeSponsorCheckout("egitim_platformu")).toBe(false);
    expect(shouldBlockSelfServeSponsorCheckout(null)).toBe(false);
    expect(shouldHideOrganizationSponsorPrices("yayinevi")).toBe(false);
    expect(shouldHideOrganizationSponsorPrices(null)).toBe(false);
  });

  it("builds a sponsor sales inquiry message", () => {
    const message = buildSponsorSalesInquiryMessage({
      organizationType: "okul",
      organizationName: "Zigo Okul",
      packageLabel: "Aylık Kurumsal Sponsorluk",
      packageDays: 30,
    });
    expect(message).toContain("Zigo Okul");
    expect(message).toContain("Okul");
    expect(message).toContain("Aylık Kurumsal Sponsorluk");
  });
});

describe("family-entitlement", () => {
  it("covers all linked child profiles when parent is premium", () => {
    const covered = buildFamilyEntitlementSummary({ isParentPremium: true, childCount: 3 });
    expect(covered.childrenCovered).toBe(true);
    expect(covered.coveredChildCount).toBe(3);
    expect(covered.unlocksChildAnalytics).toBe(true);

    const locked = buildFamilyEntitlementSummary({ isParentPremium: false, childCount: 2 });
    expect(locked.childrenCovered).toBe(false);
    expect(locked.coveredChildCount).toBe(0);
    expect(locked.unlocksChildActivityTimeline).toBe(false);
  });
});
