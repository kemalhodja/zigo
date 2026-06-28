import type { EducationOrganizationType } from "@/lib/domain/education-organization";
import type { UserRole } from "@/lib/supabase/database.types";

export type RegistrationAccountKind =
  | "student"
  | "parent"
  | "teacher"
  | "institution"
  | "platform";

export type RegistrationAccountOption = {
  id: RegistrationAccountKind;
  label: string;
  description: string;
  role: UserRole;
  organizationType: EducationOrganizationType | null;
  accent: string;
};

export const REGISTRATION_ACCOUNT_OPTIONS: readonly RegistrationAccountOption[] = [
  {
    id: "student",
    label: "Öğrenci",
    description: "YKS, LGS ve sınav hazırlığı; Match-Feed, quiz, odak ve oyunlaştırılmış öğrenme.",
    role: "student",
    organizationType: null,
    accent: "from-crystal to-berry",
  },
  {
    id: "parent",
    label: "Veli",
    description: "Öğrenci ilerlemesi, YKS hazırlık takibi, onaylar ve aile paketi.",
    role: "parent",
    organizationType: null,
    accent: "from-aqua to-mint",
  },
  {
    id: "teacher",
    label: "Öğretmen",
    description: "Doğrulama sonrası içerik ve Creator Plus araçları.",
    role: "teacher",
    organizationType: null,
    accent: "from-sun to-peach",
  },
  {
    id: "institution",
    label: "Eğitim kurumu",
    description: "Kurs, okul ve kurumsal eğitim hesabı.",
    role: "teacher",
    organizationType: "egitim_kurumu",
    accent: "from-violet-600 to-fuchsia-500",
  },
  {
    id: "platform",
    label: "Eğitim platformu",
    description: "Dijital platform ve içerik ağı hesabı.",
    role: "platform",
    organizationType: "egitim_platformu",
    accent: "from-sky-500 to-cyan-500",
  },
] as const;

const REGISTRATION_KIND_SET = new Set<RegistrationAccountKind>(
  REGISTRATION_ACCOUNT_OPTIONS.map((option) => option.id),
);

export function isRegistrationAccountKind(value: string | null | undefined): value is RegistrationAccountKind {
  return Boolean(value && REGISTRATION_KIND_SET.has(value as RegistrationAccountKind));
}

export function resolveRegistrationAccount(kind: RegistrationAccountKind) {
  const option = REGISTRATION_ACCOUNT_OPTIONS.find((item) => item.id === kind);
  if (!option) throw new Error("Invalid registration account kind.");
  return option;
}

export function isOrganizationRegistrationType(
  organizationType: EducationOrganizationType | null | undefined,
) {
  return organizationType === "egitim_kurumu" || organizationType === "egitim_platformu";
}

export function shouldHideOrganizationPlanPrices(
  organizationType: EducationOrganizationType | null | undefined,
) {
  return isOrganizationRegistrationType(organizationType);
}
