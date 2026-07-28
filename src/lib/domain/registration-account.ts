import type { EducationOrganizationType } from "@/lib/domain/education-organization";
import { isEducationOrganizationType } from "@/lib/domain/education-organization";
import type { UserRole } from "@/lib/supabase/database.types";

export type RegistrationAccountKind =
  | "student"
  | "parent"
  | "teacher"
  | "kurs"
  | "okul"
  | "institution"
  | "platform"
  | "publisher";

export type RegistrationAccountOption = {
  id: RegistrationAccountKind;
  label: string;
  description: string;
  role: UserRole;
  organizationType: EducationOrganizationType | null;
  accent: string;
};

export const REGISTRATION_ACCOUNT_KIND_VALUES = [
  "student",
  "parent",
  "teacher",
  "kurs",
  "okul",
  "institution",
  "platform",
  "publisher",
] as const satisfies readonly RegistrationAccountKind[];

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
    description: "Bireysel öğretmen; doğrulama sonrası içerik ve stüdyo araçları.",
    role: "teacher",
    organizationType: null,
    accent: "from-sun to-peach",
  },
  {
    id: "kurs",
    label: "Kurs",
    description: "Kurs merkezi veya özel ders kurumu hesabı.",
    role: "teacher",
    organizationType: "kurs",
    accent: "from-teal-600 to-emerald-500",
  },
  {
    id: "okul",
    label: "Okul",
    description: "Okul ve kampüs hesabı; branş ve yerel görünürlük.",
    role: "teacher",
    organizationType: "okul",
    accent: "from-blue-600 to-indigo-500",
  },
  {
    id: "institution",
    label: "Eğitim kurumu",
    description: "Kurumsal eğitim ve akademi hesabı.",
    role: "teacher",
    organizationType: "egitim_kurumu",
    accent: "from-violet-600 to-fuchsia-500",
  },
  {
    id: "platform",
    label: "Platform",
    description: "Dijital eğitim platformu ve içerik ağı hesabı.",
    role: "teacher",
    organizationType: "egitim_platformu",
    accent: "from-sky-500 to-cyan-500",
  },
  {
    id: "publisher",
    label: "Yayınevi",
    description: "Eğitim yayınları, kitap ve materyal hesabı.",
    role: "teacher",
    organizationType: "yayinevi",
    accent: "from-amber-600 to-orange-500",
  },
] as const;

/** Top-level signup choices shown first. */
export const REGISTRATION_PRIMARY_GROUP_IDS = ["student", "parent", "teacher", "education"] as const;
export type RegistrationPrimaryGroupId = (typeof REGISTRATION_PRIMARY_GROUP_IDS)[number];

/** Education org subtypes under the "Eğitim" primary group (signup UI). */
export const REGISTRATION_EDUCATION_KIND_IDS = ["kurs", "okul", "platform", "publisher"] as const;
export type RegistrationEducationKindId = (typeof REGISTRATION_EDUCATION_KIND_IDS)[number];

export const REGISTRATION_PRIMARY_GROUPS = [
  {
    id: "student" as const,
    label: "Öğrenci",
    description: "Öğren, quiz çöz, puan kazan.",
    accent: "from-crystal to-berry",
  },
  {
    id: "parent" as const,
    label: "Veli",
    description: "Çocuk ilerlemesi ve aile paneli.",
    accent: "from-aqua to-mint",
  },
  {
    id: "teacher" as const,
    label: "Öğretmen",
    description: "Bireysel içerik üretici hesabı.",
    accent: "from-sun to-peach",
  },
  {
    id: "education" as const,
    label: "Eğitim",
    description: "Kurs, okul, platform veya yayınevi.",
    accent: "from-violet-600 to-fuchsia-500",
  },
] as const;

/**
 * The 6 required options shown flat during signup.
 * No default — user must explicitly choose one.
 */
export const REGISTRATION_REQUIRED_SIGNUP_OPTIONS = [
  {
    id: "student" as const,
    label: "Öğrenci",
    description: "YKS, LGS ve sınav hazırlığı; quiz, odak ve oyunlaştırılmış öğrenme.",
    accent: "from-crystal to-berry",
    emoji: "🎓",
  },
  {
    id: "parent" as const,
    label: "Veli",
    description: "Öğrenci ilerlemesi, YKS takibi, onaylar ve aile paneli.",
    accent: "from-aqua to-mint",
    emoji: "👨‍👩‍👧",
  },
  {
    id: "teacher" as const,
    label: "Öğretmen",
    description: "Bireysel öğretmen; doğrulama sonrası içerik ve stüdyo araçları.",
    accent: "from-sun to-peach",
    emoji: "📚",
  },
  {
    id: "platform" as const,
    label: "Eğitim Platformu",
    description: "Dijital eğitim platformu ve içerik ağı hesabı.",
    accent: "from-sky-500 to-cyan-500",
    emoji: "💻",
  },
  {
    id: "institution" as const,
    label: "Eğitim Kurumu",
    description: "Kurs, okul, akademi ve eğitim kurumu hesabı.",
    accent: "from-violet-600 to-fuchsia-500",
    emoji: "🏛️",
  },
  {
    id: "publisher" as const,
    label: "Yayınevi",
    description: "Eğitim yayınları, kitap ve materyal hesabı.",
    accent: "from-amber-600 to-orange-500",
    emoji: "📖",
  },
] as const;

export type RequiredSignupOptionId = (typeof REGISTRATION_REQUIRED_SIGNUP_OPTIONS)[number]["id"];

export function isRegistrationEducationKind(
  value: string | null | undefined,
): value is RegistrationEducationKindId {
  return Boolean(
    value && (REGISTRATION_EDUCATION_KIND_IDS as readonly string[]).includes(value),
  );
}

export function resolveRegistrationPrimaryGroup(
  kind: RegistrationAccountKind,
): RegistrationPrimaryGroupId {
  if (kind === "student" || kind === "parent" || kind === "teacher") return kind;
  return "education";
}

export function getRegistrationEducationOptions() {
  return REGISTRATION_ACCOUNT_OPTIONS.filter((option) =>
    isRegistrationEducationKind(option.id),
  );
}

export function accountKindFromPrimaryGroup(
  group: RegistrationPrimaryGroupId,
  educationKind: RegistrationEducationKindId = "kurs",
): RegistrationAccountKind {
  if (group === "education") return educationKind;
  return group;
}

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

/** Best-effort reverse map from stored role + org type back to signup kind. */
export function resolveAccountKindFromProfile(input: {
  role: UserRole;
  organizationType?: EducationOrganizationType | null;
}): RegistrationAccountKind {
  if (input.role === "student") return "student";
  if (input.role === "parent") return "parent";

  const org = input.organizationType;
  if (org === "kurs") return "kurs";
  if (org === "okul") return "okul";
  if (org === "egitim_kurumu") return "institution";
  if (org === "egitim_platformu") return "platform";
  if (org === "yayinevi") return "publisher";
  return "teacher";
}

export function isOrganizationRegistrationType(
  organizationType: EducationOrganizationType | null | undefined,
) {
  return isEducationOrganizationType(organizationType);
}

export function shouldHideOrganizationPlanPrices(
  organizationType: EducationOrganizationType | null | undefined,
) {
  return isOrganizationRegistrationType(organizationType);
}
