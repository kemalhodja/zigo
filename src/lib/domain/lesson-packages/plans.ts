export type LessonPackagePlanId = "basic" | "pro" | "premium";

export type LessonPackagePlan = {
  id: LessonPackagePlanId;
  name: string;
  nameEn: string;
  lessonsIncluded: number;
  priceTry: number;
  durationDays: number;
  stripePriceEnvKey: string;
  highlights: string[];
  highlightsEn: string[];
};

export const LESSON_PACKAGE_PLANS: LessonPackagePlan[] = [
  {
    id: "basic",
    name: "Basic",
    nameEn: "Basic",
    lessonsIncluded: 2,
    priceTry: 299,
    durationDays: 30,
    stripePriceEnvKey: "STRIPE_PRICE_LESSON_BASIC",
    highlights: ["Ayda 2 ders hakkı", "Ders talebi & rezervasyon", "Canlı ders (Jitsi)"],
    highlightsEn: ["2 lessons per month", "Lesson requests & booking", "Live lessons (Jitsi)"],
  },
  {
    id: "pro",
    name: "Pro",
    nameEn: "Pro",
    lessonsIncluded: 5,
    priceTry: 599,
    durationDays: 30,
    stripePriceEnvKey: "STRIPE_PRICE_LESSON_PRO",
    highlights: ["Ayda 5 ders hakkı", "Akıllı öğretmen eşleşmesi", "Öncelikli destek"],
    highlightsEn: ["5 lessons per month", "Smart teacher matching", "Priority support"],
  },
  {
    id: "premium",
    name: "Premium",
    nameEn: "Premium",
    lessonsIncluded: 12,
    priceTry: 999,
    durationDays: 30,
    stripePriceEnvKey: "STRIPE_PRICE_LESSON_PREMIUM",
    highlights: ["Ayda 12 ders hakkı", "Gelişim dashboard", "Tüm veli araçları"],
    highlightsEn: ["12 lessons per month", "Development dashboard", "All parent tools"],
  },
];

export function findLessonPackagePlan(planId: string): LessonPackagePlan | undefined {
  return LESSON_PACKAGE_PLANS.find((plan) => plan.id === planId);
}

export function resolveLessonPackageStripePriceId(planId: LessonPackagePlanId): string | null {
  const plan = findLessonPackagePlan(planId);
  if (!plan) return null;
  return process.env[plan.stripePriceEnvKey]?.trim() || null;
}
