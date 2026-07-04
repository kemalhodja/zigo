export type EducationOrganizationType =
  | "kurs"
  | "okul"
  | "egitim_kurumu"
  | "egitim_platformu";

export type EducationOrganizationBillingTier = "institution" | "platform";

export type EducationOrganizationOption = {
  id: EducationOrganizationType;
  label: string;
  description: string;
  billingTier: EducationOrganizationBillingTier;
};

export const EDUCATION_ORGANIZATION_OPTIONS: readonly EducationOrganizationOption[] = [
  {
    id: "kurs",
    label: "Kurs",
    description: "Kurs merkezi veya özel ders kurumu",
    billingTier: "institution",
  },
  {
    id: "okul",
    label: "Okul",
    description: "Okul ve kampüs hesabı",
    billingTier: "institution",
  },
  {
    id: "egitim_kurumu",
    label: "Eğitim kurumu",
    description: "Kurumsal eğitim ve akademi hesabı",
    billingTier: "institution",
  },
  {
    id: "egitim_platformu",
    label: "Eğitim platformu",
    description: "Dijital eğitim platformu ve içerik ağı",
    billingTier: "platform",
  },
] as const;

const ORGANIZATION_TYPE_SET = new Set<EducationOrganizationType>(
  EDUCATION_ORGANIZATION_OPTIONS.map((option) => option.id),
);

export function isEducationOrganizationType(value: string | null | undefined): value is EducationOrganizationType {
  return Boolean(value && ORGANIZATION_TYPE_SET.has(value as EducationOrganizationType));
}

export function resolveOrganizationBillingTier(
  organizationType: EducationOrganizationType | null | undefined,
): EducationOrganizationBillingTier | null {
  if (!organizationType) return null;
  const option = EDUCATION_ORGANIZATION_OPTIONS.find((item) => item.id === organizationType);
  return option?.billingTier ?? null;
}

export function getOrganizationOption(organizationType: EducationOrganizationType | null | undefined) {
  if (!organizationType) return null;
  return EDUCATION_ORGANIZATION_OPTIONS.find((item) => item.id === organizationType) ?? null;
}
