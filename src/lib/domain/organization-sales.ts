import { type EducationOrganizationType,getOrganizationOption } from "@/lib/domain/education-organization";
import { shouldHideOrganizationPlanPrices } from "@/lib/domain/registration-account";
import { findPlanGroup } from "@/lib/domain/subscription-plans";
import { buildWhatsAppSupportUrl } from "@/lib/domain/support-contact";

const SALES_ASSISTED_PLAN_PREFIXES = ["institution-", "platform-", "publisher-"] as const;

export function isSalesAssistedPlanId(planId: string) {
  return SALES_ASSISTED_PLAN_PREFIXES.some((prefix) => planId.startsWith(prefix));
}

export function shouldBlockSelfServeOrgCheckout(
  _organizationType: EducationOrganizationType | null | undefined,
  _planId?: string | null,
) {
  return false;
}

/** Org accounts (kurs/okul/platform/yayinevi) use sales-assisted sponsor boosts — no public price checkout. */
export function shouldBlockSelfServeSponsorCheckout(
  organizationType: EducationOrganizationType | null | undefined,
) {
  return shouldHideOrganizationPlanPrices(organizationType);
}

export function shouldHideOrganizationSponsorPrices(
  organizationType: EducationOrganizationType | null | undefined,
) {
  return shouldHideOrganizationPlanPrices(organizationType);
}

export function buildOrganizationSalesInquiryMessage(input: {
  organizationType?: EducationOrganizationType | null;
  organizationName?: string | null;
  planTitle?: string | null;
}) {
  const orgLabel =
    getOrganizationOption(input.organizationType)?.label ??
    (input.organizationType ? String(input.organizationType) : "kurum");
  const name = input.organizationName?.trim() || "Zigo hesabı";
  const plan = input.planTitle?.trim() || "kurumsal abonelik";
  return `Merhaba, ${name} (${orgLabel}) için ${plan} teklifi almak istiyorum.`;
}

export function buildOrganizationSalesWhatsAppUrl(input: {
  organizationType?: EducationOrganizationType | null;
  organizationName?: string | null;
  planTitle?: string | null;
}) {
  return buildWhatsAppSupportUrl(buildOrganizationSalesInquiryMessage(input));
}

export function buildSponsorSalesInquiryMessage(input: {
  organizationType?: EducationOrganizationType | null;
  organizationName?: string | null;
  packageLabel?: string | null;
  packageDays?: number | null;
}) {
  const orgLabel =
    getOrganizationOption(input.organizationType)?.label ??
    (input.organizationType ? String(input.organizationType) : "kurum");
  const name = input.organizationName?.trim() || "Zigo hesabı";
  const packagePart =
    input.packageLabel?.trim() ||
    (input.packageDays ? `${input.packageDays} günlük sponsorluk` : "sponsorlu reklam paketi");
  return `Merhaba, ${name} (${orgLabel}) için ${packagePart} teklifi almak istiyorum.`;
}

export function buildSponsorSalesWhatsAppUrl(input: {
  organizationType?: EducationOrganizationType | null;
  organizationName?: string | null;
  packageLabel?: string | null;
  packageDays?: number | null;
}) {
  return buildWhatsAppSupportUrl(buildSponsorSalesInquiryMessage(input));
}

export function resolveSalesAssistedPlanTitle(planId: string) {
  return findPlanGroup(planId)?.title ?? null;
}
