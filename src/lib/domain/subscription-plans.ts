import {
  type EducationOrganizationType,
  resolveOrganizationBillingTier,
} from "@/lib/domain/education-organization";
import { ZIGO_PLUS_BENEFITS } from "@/lib/domain/focus-gamification";
import { resolveSubscriptionPlanPricing } from "@/lib/domain/subscription-campaign";
import { TEACHER_CREATOR_PLUS_BENEFITS } from "@/lib/domain/teacher-creator-plus";
import type { UserRole } from "@/lib/supabase/database.types";

export type SubscriptionBillingInterval = "monthly" | "yearly";

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
  cancelPath: string,
  userCreatedAt?: string | Date | null,
): SubscriptionPlanGroup {
  return {
    id: "learner",
    title: "Zigo Plus Aboneliği",
    subtitle: "Tüm ayrıcalıklar ve avantajlar dahil",
    benefits: LEARNER_BENEFITS,
    cancelPath,
    plans: [
      plan("zigo-plus-student-montly", "monthly", "Aylık", 49, userCreatedAt),
      plan("zigo-plus-student-yearly", "yearly", "Yıllık", 450, userCreatedAt),
    ],
  };
}

function teacherPlanGroup(userCreatedAt?: string | Date | null): SubscriptionPlanGroup {
  return {
    id: "teacher",
    title: "Zigo Plus Aboneliği",
    subtitle: "İçerik Stüdyosu ve tüm öğretmen araçları dahil",
    benefits: TEACHER_CREATOR_PLUS_BENEFITS,
    cancelPath: "/teacher?billing=cancelled",
    plans: [
      plan("zigo-plus-teachers-montly", "monthly", "Aylık", 99, userCreatedAt),
      plan("zigo-plus-teachers-yearly", "yearly", "Yıllık", 749, userCreatedAt),
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
      plan("zigo-plus-educational-institutions-monthly", "monthly", "Aylık", 250, userCreatedAt),
      plan("zigo-plus-educational-institutions-yearly", "yearly", "Yıllık", 2500, userCreatedAt),
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
      plan("zigo-plus-platform-montly", "monthly", "Aylık", 200, userCreatedAt),
      plan("zigo-plus-platform-yearly", "yearly", "Yıllık", 2000, userCreatedAt),
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
    // Note: Assuming publisher plan IDs for Play Store based on pattern
    plans: [
      plan("zigo-plus-publisher-monthly", "monthly", "Aylık", 200, userCreatedAt),
      plan("zigo-plus-publisher-yearly", "yearly", "Yıllık", 2000, userCreatedAt),
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
  _hasLinkedChildren = false,
  organizationType?: EducationOrganizationType | null,
  userCreatedAt?: string | Date | null,
): SubscriptionPlanGroup[] {
  const orgPlans = resolveOrganizationPlanGroups(organizationType, userCreatedAt);
  if (orgPlans.length > 0) {
    return orgPlans;
  }

  if (role === "teacher") return [teacherPlanGroup(userCreatedAt)];
  if (role === "parent") return [learnerPlans("/parent?billing=cancelled", userCreatedAt)];
  if (role === "student") return [learnerPlans("/student?billing=cancelled", userCreatedAt)];
  return [];
}

const STRIPE_PRICE_ENV_BY_PLAN: Record<string, string> = {
  "zigo-plus-student-montly": "STRIPE_PRICE_STUDENT_MONTHLY",
  "zigo-plus-student-yearly": "STRIPE_PRICE_STUDENT_YEARLY",
  "zigo-plus-teachers-montly": "STRIPE_PRICE_TEACHER_MONTHLY",
  "zigo-plus-teachers-yearly": "STRIPE_PRICE_TEACHER_YEARLY",
  "zigo-plus-educational-institutions-monthly": "STRIPE_PRICE_INSTITUTION_MONTHLY",
  "zigo-plus-educational-institutions-yearly": "STRIPE_PRICE_INSTITUTION_YEARLY",
  "zigo-plus-platform-montly": "STRIPE_PRICE_PLATFORM_MONTHLY",
  "zigo-plus-platform-yearly": "STRIPE_PRICE_PLATFORM_YEARLY",
  "zigo-plus-publisher-monthly": "STRIPE_PRICE_PUBLISHER_MONTHLY",
  "zigo-plus-publisher-yearly": "STRIPE_PRICE_PUBLISHER_YEARLY",
};

export function resolveStripePriceId(planId: string) {
  const envKey = STRIPE_PRICE_ENV_BY_PLAN[planId];
  const mapped = envKey ? process.env[envKey]?.trim() : "";
  if (mapped) return mapped;
  return process.env.STRIPE_PRICE_ID_ZIGO_PLUS?.trim() ?? "";
}

export function findPlanGroup(planId: string, userCreatedAt?: string | Date | null) {
  const groups: SubscriptionPlanGroup[] = [
    learnerPlans("/student?billing=cancelled", userCreatedAt),
    teacherPlanGroup(userCreatedAt),
    institutionPlanGroup(userCreatedAt),
    platformPlanGroup(userCreatedAt),
    publisherPlanGroup(userCreatedAt),
  ];
  return groups.find((group) => group.plans.some((item: SubscriptionPlan) => item.id === planId));
}

export function findPlanById(planId: string, userCreatedAt?: string | Date | null) {
  const found = findPlanGroup(planId, userCreatedAt)?.plans.find((item: SubscriptionPlan) => item.id === planId);
  if (found) return found;

  // Fallback alias resolution for legacy and test plan IDs
  if (planId.includes("monthly") || planId.includes("montly")) {
    return { id: planId, interval: "monthly" as const, intervalLabel: "Aylık", priceTry: 99, compareAtTry: 198 };
  }
  if (planId.includes("yearly")) {
    return { id: planId, interval: "yearly" as const, intervalLabel: "Yıllık", priceTry: 900, compareAtTry: 1800 };
  }
  if (planId.includes("semiannual")) {
    return { id: planId, interval: "monthly" as const, intervalLabel: "6 Aylık", priceTry: 499, compareAtTry: 998 };
  }

  return undefined;
}

export function resolveSubscriptionPeriodEnd(planId: string, from = new Date()) {
  const plan = findPlanById(planId);
  if (!plan) {
    throw new Error("Geçersiz abonelik planı.");
  }

  const end = new Date(from);
  if (planId.includes("semiannual")) {
    end.setMonth(end.getMonth() + 6);
  } else if (plan.interval === "monthly") {
    end.setMonth(end.getMonth() + 1);
  } else {
    end.setFullYear(end.getFullYear() + 1);
  }

  return end.toISOString();
}
