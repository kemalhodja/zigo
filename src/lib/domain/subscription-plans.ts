import {
  type EducationOrganizationType,
  resolveOrganizationBillingTier,
} from "@/lib/domain/education-organization";
import { ZIGO_PLUS_BENEFITS } from "@/lib/domain/focus-gamification";
import { resolveSubscriptionPlanPricing } from "@/lib/domain/subscription-campaign";
import { TEACHER_CREATOR_PLUS_BENEFITS } from "@/lib/domain/teacher-creator-plus";
import type { UserRole } from "@/lib/supabase/database.types";

export type SubscriptionBillingInterval = "monthly" | "semiannual" | "yearly";

export type SubscriptionPlan = {
  id: string;
  interval: SubscriptionBillingInterval;
  intervalLabel: string;
  priceTry: number;
  compareAtTry: number;
};

export type SubscriptionPlanGroup = {
  id: string;
  title: string;
  subtitle: string;
  benefits: readonly string[];
  plans: SubscriptionPlan[];
  cancelPath: string;
};

const LEARNER_BENEFITS = ZIGO_PLUS_BENEFITS;
const FAMILY_BENEFITS = [
  "Bağlı öğrenci profilleri tek abonelikte",
  "Veli oturumunda çocuk odaklı analitik ve aktivite zaman çizelgesi",
  "YKS ve LGS yazılı hazırlık kaynaklarına erişim",
  "Gelişmiş odak analitiği ve veli panelleri",
] as const;

function plan(
  id: string,
  interval: SubscriptionBillingInterval,
  intervalLabel: string,
  listPriceTry: number,
  userCreatedAt?: string | Date | null,
): SubscriptionPlan {
  const pricing = resolveSubscriptionPlanPricing(listPriceTry, userCreatedAt);
  return {
    id,
    interval,
    intervalLabel,
    priceTry: pricing.priceTry,
    compareAtTry: pricing.compareAtTry,
  };
}

function learnerPlans(
  prefix: "student" | "parent",
  cancelPath: string,
  userCreatedAt?: string | Date | null,
): SubscriptionPlanGroup {
  return {
    id: prefix,
    title: prefix === "student" ? "Öğrenci Zigo Plus" : "Veli Zigo Plus",
    subtitle: "Abonelik özellikleri ve fiyat",
    benefits: LEARNER_BENEFITS,
    cancelPath,
    plans: [
      plan(`${prefix}-monthly`, "monthly", "Aylık", 99, userCreatedAt),
      plan(`${prefix}-semiannual`, "semiannual", "6 Aylık", 500, userCreatedAt),
      plan(`${prefix}-yearly`, "yearly", "Yıllık", 900, userCreatedAt),
    ],
  };
}

function familyPlanGroup(userCreatedAt?: string | Date | null): SubscriptionPlanGroup {
  return {
    id: "family",
    title: "Aile Paketi",
    subtitle: "Veli + bağlı öğrenci profilleri için tek abonelik",
    benefits: FAMILY_BENEFITS,
    cancelPath: "/parent?billing=cancelled",
    plans: [
      plan("family-monthly", "monthly", "Aylık", 149, userCreatedAt),
      plan("family-semiannual", "semiannual", "6 Aylık", 700, userCreatedAt),
      plan("family-yearly", "yearly", "Yıllık", 1200, userCreatedAt),
    ],
  };
}

function teacherPlanGroup(userCreatedAt?: string | Date | null): SubscriptionPlanGroup {
  return {
    id: "teacher",
    title: "Öğretmen Creator Plus",
    subtitle: "Abonelik özellikleri ve fiyat",
    benefits: TEACHER_CREATOR_PLUS_BENEFITS,
    cancelPath: "/teacher?billing=cancelled",
    plans: [
      plan("teacher-monthly", "monthly", "Aylık", 199, userCreatedAt),
      plan("teacher-semiannual", "semiannual", "6 Aylık", 1000, userCreatedAt),
      plan("teacher-yearly", "yearly", "Yıllık", 1499, userCreatedAt),
    ],
  };
}

const INSTITUTION_BENEFITS = [
  "Kurs, okul ve eğitim kurumu vitrini",
  "Branş bazlı Match-Feed ve içerik dağıtımı",
  "Öğretmen, veli ve öğrenci yönetim paneli",
  "Kurumsal analitik ve Creator Plus araçları",
] as const;

const PLATFORM_BENEFITS = [
  "Dijital eğitim platformu vitrini",
  "Çok branşlı içerik ve abonelik yönetimi",
  "Match-Feed ile hedef kitleye ulaşım",
  "Kurumsal raporlama ve entegrasyon altyapısı",
] as const;

const PUBLISHER_BENEFITS = [
  "Yayınevi vitrini ve marka görünürlüğü",
  "Kitap ve materyal içerik dağıtımı",
  "Branş bazlı Match-Feed erişimi",
  "Kurumsal raporlama ve Creator Plus araçları",
] as const;

function institutionPlanGroup(userCreatedAt?: string | Date | null): SubscriptionPlanGroup {
  return {
    id: "institution",
    title: "Eğitim Kurumu Aboneliği",
    subtitle: "Kurs · Okul · Eğitim kurumu — branşlarla birlikte",
    benefits: INSTITUTION_BENEFITS,
    cancelPath: "/profile?billing=cancelled",
    plans: [
      plan("institution-monthly", "monthly", "Aylık", 500, userCreatedAt),
      plan("institution-semiannual", "semiannual", "6 Aylık", 2800, userCreatedAt),
      plan("institution-yearly", "yearly", "Yıllık", 5000, userCreatedAt),
    ],
  };
}

function platformPlanGroup(userCreatedAt?: string | Date | null): SubscriptionPlanGroup {
  return {
    id: "platform",
    title: "Eğitim Platformu Aboneliği",
    subtitle: "Dijital platform hesabı — branşlarla birlikte",
    benefits: PLATFORM_BENEFITS,
    cancelPath: "/profile?billing=cancelled",
    plans: [
      plan("platform-monthly", "monthly", "Aylık", 400, userCreatedAt),
      plan("platform-semiannual", "semiannual", "6 Aylık", 2200, userCreatedAt),
      plan("platform-yearly", "yearly", "Yıllık", 4000, userCreatedAt),
    ],
  };
}

function publisherPlanGroup(userCreatedAt?: string | Date | null): SubscriptionPlanGroup {
  return {
    id: "publisher",
    title: "Yayınevi Aboneliği",
    subtitle: "Yayın evi hesabı — branşlarla birlikte",
    benefits: PUBLISHER_BENEFITS,
    cancelPath: "/profile?billing=cancelled",
    plans: [
      plan("publisher-monthly", "monthly", "Aylık", 400, userCreatedAt),
      plan("publisher-semiannual", "semiannual", "6 Aylık", 2200, userCreatedAt),
      plan("publisher-yearly", "yearly", "Yıllık", 4000, userCreatedAt),
    ],
  };
}

export function formatTryPrice(amount: number) {
  return `${amount.toLocaleString("tr-TR")} ₺`;
}

export { isSubscriptionCampaignActive } from "@/lib/domain/subscription-campaign";

export function resolveOrganizationPlanGroups(
  organizationType: EducationOrganizationType | null | undefined,
  userCreatedAt?: string | Date | null,
): SubscriptionPlanGroup[] {
  const billingTier = resolveOrganizationBillingTier(organizationType);
  if (billingTier === "institution") return [institutionPlanGroup(userCreatedAt)];
  if (billingTier === "platform") return [platformPlanGroup(userCreatedAt)];
  if (billingTier === "publisher") return [publisherPlanGroup(userCreatedAt)];
  return [];
}

export function resolveProfilePlanGroups(
  role: UserRole | null | undefined,
  hasLinkedChildren = false,
  organizationType?: EducationOrganizationType | null,
  userCreatedAt?: string | Date | null,
): SubscriptionPlanGroup[] {
  const orgPlans = resolveOrganizationPlanGroups(organizationType, userCreatedAt);
  if (orgPlans.length > 0) {
    return orgPlans;
  }

  if (role === "teacher") return [teacherPlanGroup(userCreatedAt)];
  if (role === "parent") {
    return hasLinkedChildren
      ? [familyPlanGroup(userCreatedAt), learnerPlans("parent", "/parent?billing=cancelled", userCreatedAt)]
      : [learnerPlans("parent", "/parent?billing=cancelled", userCreatedAt)];
  }
  if (role === "student") {
    return [learnerPlans("student", "/student?billing=cancelled", userCreatedAt)];
  }
  return [];
}

const STRIPE_PRICE_ENV_BY_PLAN: Record<string, string> = {
  "student-monthly": "STRIPE_PRICE_STUDENT_MONTHLY",
  "student-semiannual": "STRIPE_PRICE_STUDENT_SEMIANNUAL",
  "student-yearly": "STRIPE_PRICE_STUDENT_YEARLY",
  "parent-monthly": "STRIPE_PRICE_PARENT_MONTHLY",
  "parent-semiannual": "STRIPE_PRICE_PARENT_SEMIANNUAL",
  "parent-yearly": "STRIPE_PRICE_PARENT_YEARLY",
  "family-monthly": "STRIPE_PRICE_FAMILY_MONTHLY",
  "family-semiannual": "STRIPE_PRICE_FAMILY_SEMIANNUAL",
  "family-yearly": "STRIPE_PRICE_FAMILY_YEARLY",
  "teacher-monthly": "STRIPE_PRICE_TEACHER_MONTHLY",
  "teacher-semiannual": "STRIPE_PRICE_TEACHER_SEMIANNUAL",
  "teacher-yearly": "STRIPE_PRICE_TEACHER_YEARLY",
  "institution-monthly": "STRIPE_PRICE_INSTITUTION_MONTHLY",
  "institution-semiannual": "STRIPE_PRICE_INSTITUTION_SEMIANNUAL",
  "institution-yearly": "STRIPE_PRICE_INSTITUTION_YEARLY",
  "platform-monthly": "STRIPE_PRICE_PLATFORM_MONTHLY",
  "platform-semiannual": "STRIPE_PRICE_PLATFORM_SEMIANNUAL",
  "platform-yearly": "STRIPE_PRICE_PLATFORM_YEARLY",
  "publisher-monthly": "STRIPE_PRICE_PUBLISHER_MONTHLY",
  "publisher-semiannual": "STRIPE_PRICE_PUBLISHER_SEMIANNUAL",
  "publisher-yearly": "STRIPE_PRICE_PUBLISHER_YEARLY",
};

export function resolveStripePriceId(planId: string) {
  const envKey = STRIPE_PRICE_ENV_BY_PLAN[planId];
  const mapped = envKey ? process.env[envKey]?.trim() : "";
  if (mapped) return mapped;
  return process.env.STRIPE_PRICE_ID_ZIGO_PLUS?.trim() ?? "";
}

export function findPlanGroup(planId: string, userCreatedAt?: string | Date | null) {
  const groups: SubscriptionPlanGroup[] = [
    learnerPlans("student", "/student?billing=cancelled", userCreatedAt),
    learnerPlans("parent", "/parent?billing=cancelled", userCreatedAt),
    familyPlanGroup(userCreatedAt),
    teacherPlanGroup(userCreatedAt),
    institutionPlanGroup(userCreatedAt),
    platformPlanGroup(userCreatedAt),
    publisherPlanGroup(userCreatedAt),
  ];
  return groups.find((group) => group.plans.some((item: SubscriptionPlan) => item.id === planId));
}

export function findPlanById(planId: string, userCreatedAt?: string | Date | null) {
  return findPlanGroup(planId, userCreatedAt)?.plans.find((item: SubscriptionPlan) => item.id === planId);
}

export function resolveSubscriptionPeriodEnd(planId: string, from = new Date()) {
  const plan = findPlanById(planId);
  if (!plan) {
    throw new Error("Geçersiz abonelik planı.");
  }

  const end = new Date(from);
  if (plan.interval === "monthly") {
    end.setMonth(end.getMonth() + 1);
  } else if (plan.interval === "semiannual") {
    end.setMonth(end.getMonth() + 6);
  } else {
    end.setFullYear(end.getFullYear() + 1);
  }

  return end.toISOString();
}
