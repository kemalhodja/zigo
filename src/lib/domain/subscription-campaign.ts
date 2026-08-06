/** Zigo Dinamik Fiyatlandırma ve 30 Günlük Deneme Sürümü Motoru */

export const SUBSCRIPTION_TRIAL_DAYS = 30;
export const EARLY_BIRD_DISCOUNT_PERCENT = 50; // Kayıttan sonraki ilk 30 gün içinde %50 indirim
export const STANDARD_DISCOUNT_PERCENT = 15;   // 30 günden sonra %15 standart indirim

export const SUBSCRIPTION_CAMPAIGN = {
  id: "zigo-trial-pricing",
  earlyBirdDiscountPercent: EARLY_BIRD_DISCOUNT_PERCENT,
  standardDiscountPercent: STANDARD_DISCOUNT_PERCENT,
  discountPercent: EARLY_BIRD_DISCOUNT_PERCENT,
  badgeLabel: "30 Gün Ücretsiz Deneme",
  headline: "30 Gün Tam Özellikli Ücretsiz Deneme",
  description: "1 Eylül 2026 tarihine kadar kayıt olan tüm kullanıcılar ilk 30 gün ücretsiz deneme hakkına sahiptir. İlk 30 gün içinde abone olursanız %50, sonrasında %15 indirim uygulanır.",
  stripeCouponId: "zigo-50off",
  stripePromotionCode: "ZIGO50",
  stripeCouponEnvKey: "STRIPE_COUPON_50OFF",
  trialDays: SUBSCRIPTION_TRIAL_DAYS,
  endsAt: new Date("2026-09-01T23:59:59Z"),
} as const;

export function isSubscriptionCampaignActive(now = new Date()) {
  return now.getTime() <= SUBSCRIPTION_CAMPAIGN.endsAt.getTime();
}

/**
 * Dinamik Fiyatlandırma Motoru:
 * - Kayıt tarihi 30 gün içindeyse (veya isWithinTrialWindow = true): %50 İndirim
 * - 30 gün geçtikten sonra: %15 Standart İndirim
 */
export function calculateDynamicPrice(
  listPriceTry: number,
  userCreatedAt?: string | Date | null,
  now = new Date(),
) {
  let isWithinTrialWindow = true;

  if (userCreatedAt) {
    const created = new Date(userCreatedAt);
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    isWithinTrialWindow = diffDays <= SUBSCRIPTION_TRIAL_DAYS;
  }

  const discountPercent = isWithinTrialWindow
    ? EARLY_BIRD_DISCOUNT_PERCENT
    : STANDARD_DISCOUNT_PERCENT;

  const multiplier = (100 - discountPercent) / 100;
  const discountedPrice = Math.max(1, Math.round(listPriceTry * multiplier));

  return {
    priceTry: discountedPrice,
    compareAtTry: listPriceTry,
    discountPercent,
    isWithinTrialWindow,
    trialDays: SUBSCRIPTION_TRIAL_DAYS,
    campaignActive: true as const,
  };
}

export function resolveSubscriptionPlanPricing(
  listPriceTry: number,
  userCreatedAt?: string | Date | null,
  now = new Date(),
) {
  return calculateDynamicPrice(listPriceTry, userCreatedAt, now);
}

export function getSubscriptionCampaignStripeCouponId(discountPercent = 50) {
  if (discountPercent >= 50) {
    return process.env.STRIPE_COUPON_50OFF?.trim() || "zigo-50off";
  }
  return process.env.STRIPE_COUPON_15OFF?.trim() || "zigo-15off";
}

