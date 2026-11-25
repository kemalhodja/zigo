import {
  type EducationOrganizationType,
  resolveOrganizationBillingTier,
} from "@/lib/domain/education-organization";
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

export const SUBSCRIPTION_LIST_PRICES = {
  student: { monthly: 79, yearly: 690 },
  parent: { monthly: 79, yearly: 690 },
  teacher: { monthly: 149, yearly: 1190 },
  institution: { monthly: 1490, yearly: 14900 },
  platform: { monthly: 990, yearly: 9900 },
  publisher: { monthly: 990, yearly: 9900 },
} as const;

export type B2bEnterpriseTier = {
  id: string;
  name: string;
  seatRange: string;
  monthlyTry: number | null;
  yearlyTry: number | null;
  highlight?: boolean;
  features: readonly string[];
};

export const B2B_ENTERPRISE_TIERS: readonly B2bEnterpriseTier[] = [
  {
    id: "starter-campus",
    name: "Başlangıç Kurum",
    seatRange: "1 – 100 Öğrenci",
    monthlyTry: SUBSCRIPTION_LIST_PRICES.institution.monthly,
    yearlyTry: SUBSCRIPTION_LIST_PRICES.institution.yearly,
    features: [
      "Kurumsal doğrulanmış vitrin ve marka rozeti",
      "100 öğrenciye kadar toplu sınıf ve veli takibi",
      "Branş bazlı Match-Feed içerik dağıtımı",
      "Sınırsız öğretmen gönderisi ve kısa tanıtım videosu",
    ],
  },
  {
    id: "growth-campus",
    name: "Kampüs & Dershane",
    seatRange: "101 – 500 Öğrenci",
    monthlyTry: 3990,
    yearlyTry: 39900,
    highlight: true,
    features: [
      "500 öğrenciye kadar tam Zigo Plus & analitik",
      "Şube/sınıf bazlı haftalık veli gelişim raporları",
      "Öncelikli Keşfet vitrini ve kurum içi quiz ligleri",
      "Özel kurumsal onboarding ve öncelikli destek",
    ],
  },
  {
    id: "enterprise-chain",
    name: "Zincir Okul & Yayınevi",
    seatRange: "500+ Öğrenci / Özel",
    monthlyTry: null,
    yearlyTry: null,
    features: [
      "Sınırsız kampüs, öğretmen ve öğrenci koltuğu",
      "Özel yıllık kurumsal lisans ve faturalandırma",
      "Yayınevi soru bankası ve dijital müfredat vitrini",
      "Özel hesap yöneticisi ve SLA garantisi",
    ],
  },
] as const;

const LEARNER_BENEFITS = [
  "Limitsiz soru çözümü ve tüm dış ders bağlantıları (YouTube, Vimeo vb.)",
  "Tüm branşlarda detaylı performans analizi",
  "Zeka Oyunları Salonu (günde 2 saat, 08:00–22:00 güvenli erişim)",
  "Gelişmiş aile ve veli raporları",
] as const;

function plan(
  id: string,
  interval: SubscriptionBillingInterval,
  intervalLabel: string,
  listPriceTry: number,
  userCreatedAt?: string | Date | null,
  role?: string | null,
): SubscriptionPlan {
  const pricing = resolveSubscriptionPlanPricing(listPriceTry, userCreatedAt, new Date(), role);
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
  role?: string | null,
): SubscriptionPlanGroup {
  return {
    id: "learner",
    title: "Zigo Plus Aboneliği",
    subtitle: "Tüm ayrıcalıklar ve avantajlar dahil",
    benefits: LEARNER_BENEFITS,
    cancelPath,
    plans: [
      plan("zigo-plus-student-monthly", "monthly", "Aylık", SUBSCRIPTION_LIST_PRICES.student.monthly, userCreatedAt, role ?? "student"),
      plan("zigo-plus-student-yearly", "yearly", "Yıllık", SUBSCRIPTION_LIST_PRICES.student.yearly, userCreatedAt, role ?? "student"),
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
      plan("zigo-plus-teachers-monthly", "monthly", "Aylık", SUBSCRIPTION_LIST_PRICES.teacher.monthly, userCreatedAt, "teacher"),
      plan("zigo-plus-teachers-yearly", "yearly", "Yıllık", SUBSCRIPTION_LIST_PRICES.teacher.yearly, userCreatedAt, "teacher"),
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
      plan("zigo-plus-educational-institutions-monthly", "monthly", "Aylık", SUBSCRIPTION_LIST_PRICES.institution.monthly, userCreatedAt),
      plan("zigo-plus-educational-institutions-yearly", "yearly", "Yıllık", SUBSCRIPTION_LIST_PRICES.institution.yearly, userCreatedAt),
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
      plan("zigo-plus-platform-monthly", "monthly", "Aylık", SUBSCRIPTION_LIST_PRICES.platform.monthly, userCreatedAt),
      plan("zigo-plus-platform-yearly", "yearly", "Yıllık", SUBSCRIPTION_LIST_PRICES.platform.yearly, userCreatedAt),
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
      plan("zigo-plus-publisher-monthly", "monthly", "Aylık", SUBSCRIPTION_LIST_PRICES.publisher.monthly, userCreatedAt),
      plan("zigo-plus-publisher-yearly", "yearly", "Yıllık", SUBSCRIPTION_LIST_PRICES.publisher.yearly, userCreatedAt),
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
  if (role === "parent") return [learnerPlans("/parent?billing=cancelled", userCreatedAt, "parent")];
  if (role === "student") return [learnerPlans("/student?billing=cancelled", userCreatedAt, "student")];
  return [];
}

const STRIPE_PRICE_ENV_BY_PLAN: Record<string, string> = {
  "zigo-plus-student-monthly": "STRIPE_PRICE_STUDENT_MONTHLY",
  "zigo-plus-student-yearly": "STRIPE_PRICE_STUDENT_YEARLY",
  "zigo-plus-teachers-monthly": "STRIPE_PRICE_TEACHER_MONTHLY",
  "zigo-plus-teachers-yearly": "STRIPE_PRICE_TEACHER_YEARLY",
  "zigo-plus-educational-institutions-monthly": "STRIPE_PRICE_INSTITUTION_MONTHLY",
  "zigo-plus-educational-institutions-yearly": "STRIPE_PRICE_INSTITUTION_YEARLY",
  "zigo-plus-platform-monthly": "STRIPE_PRICE_PLATFORM_MONTHLY",
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
  if (planId.startsWith("sponsor-") || planId.includes("sponsor")) {
    const end = new Date(from);
    if (planId.includes("30") || planId.includes("monthly")) {
      end.setDate(end.getDate() + 30);
    } else {
      end.setDate(end.getDate() + 7);
    }
    return end.toISOString();
  }

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

/**
 * Checks if a given productId or planId is a recognized Zigo Plus subscription product.
 */
export function isZigoSubscriptionProduct(productId?: string | null): boolean {
  if (!productId) return false;
  const normalized = productId.toLowerCase().trim().replace(/[-_]/g, "");
  return (
    normalized.includes("zigoplus") ||
    normalized.includes("studentmonthly") ||
    normalized.includes("studentyearly") ||
    normalized.includes("teachersmonthly") ||
    normalized.includes("teachersyearly") ||
    normalized.includes("institutionsmonthly") ||
    normalized.includes("institutionsyearly") ||
    normalized.includes("platformsmonthly") ||
    normalized.includes("platformsyearly") ||
    normalized.includes("publishersmonthly") ||
    normalized.includes("publishersyearly") ||
    normalized === "monthly" ||
    normalized === "yearly"
  );
}

/**
 * Checks whether a verified Google Play product is compatible with the requested subscription plan.
 * Handles cases where Google Play Console uses parent subscription ID (e.g. zigo_plus) while
 * client requested a specific base plan (e.g. zigo-plus-student-monthly), or vice versa.
 */
export function areSubscriptionProductsCompatible(
  verifiedProductId?: string | null,
  requestedProductId?: string | null,
): boolean {
  if (!verifiedProductId || !requestedProductId) return false;
  const v = verifiedProductId.trim().toLowerCase();
  const r = requestedProductId.trim().toLowerCase();

  // Exact match
  if (v === r) return true;

  // Hyphen vs underscore match (zigo-plus vs zigo_plus)
  if (v.replace(/-/g, "_") === r.replace(/-/g, "_")) return true;

  // Both belong to recognized Zigo Plus family
  if (isZigoSubscriptionProduct(v) && isZigoSubscriptionProduct(r)) {
    // If interval can be determined, ensure they don't mix monthly with yearly
    const vIsYearly = v.includes("year") || v.includes("yil") || v.includes("annual");
    const rIsYearly = r.includes("year") || r.includes("yil") || r.includes("annual");
    const vIsGeneric = v === "zigo_plus" || v === "zigo-plus";
    const rIsGeneric = r === "zigo_plus" || r === "zigo-plus";

    if (vIsGeneric || rIsGeneric) {
      return true;
    }
    return vIsYearly === rIsYearly;
  }

  return false;
}
