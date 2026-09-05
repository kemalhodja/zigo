/** Zigo Dinamik Fiyatlandırma ve 7 Günlük Deneme Sürümü Motoru */

export const SUBSCRIPTION_TRIAL_DAYS = 7;
export const EARLY_BIRD_DISCOUNT_PERCENT = 50; // Kayıttan sonraki ilk 7 gün içinde %50 indirim
export const STANDARD_DISCOUNT_PERCENT = 0;    // 7 günden sonra indirim yok (%0 / Tam Liste Fiyatı)

export const SUBSCRIPTION_CAMPAIGN = {
  id: "zigo-trial-pricing",
  earlyBirdDiscountPercent: EARLY_BIRD_DISCOUNT_PERCENT,
  standardDiscountPercent: STANDARD_DISCOUNT_PERCENT,
  discountPercent: EARLY_BIRD_DISCOUNT_PERCENT,
  badgeLabel: "7 Gün Özel Fırsat",
  headline: "İlk 7 Güne Özel %50 İndirim",
  description: "Kayıttan sonraki ilk 7 gün içinde ZIGO50 promosyon kodunu kullanarak %50 indirim kazanabilirsiniz.",
  stripeCouponId: "zigo-50off",
  stripePromotionCode: "ZIGO50",
  stripeCouponEnvKey: "STRIPE_COUPON_50OFF",
  trialDays: SUBSCRIPTION_TRIAL_DAYS,
  endsAt: new Date("2099-12-31T23:59:59Z"),
} as const;

export function isSubscriptionCampaignActive(now = new Date()) {
  return now.getTime() <= SUBSCRIPTION_CAMPAIGN.endsAt.getTime();
}

/**
 * Dinamik Fiyatlandırma Motoru:
 * - Otomatik indirim uygulanmaz (Her zaman Liste Fiyatı geçerlidir)
 * - Yalnızca 7 gün kuralı hesaplanıp dışarıya aktarılır (Modal'da promosyon kodu kontrolü için)
 */
export function calculateDynamicPrice(
  listPriceTry: number,
  userCreatedAt?: string | Date | null,
  now = new Date(),
) {
  let isWithinTrialWindow = true;
  let trialDaysRemaining = SUBSCRIPTION_TRIAL_DAYS;

  if (userCreatedAt) {
    const created = new Date(userCreatedAt);
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    isWithinTrialWindow = diffDays <= SUBSCRIPTION_TRIAL_DAYS;
    trialDaysRemaining = Math.max(0, SUBSCRIPTION_TRIAL_DAYS - diffDays);
  } else {
    isWithinTrialWindow = true;
    trialDaysRemaining = SUBSCRIPTION_TRIAL_DAYS;
  }

  const discountPercent = isWithinTrialWindow ? EARLY_BIRD_DISCOUNT_PERCENT : STANDARD_DISCOUNT_PERCENT;

  const multiplier = (100 - discountPercent) / 100;
  const discountedPrice = Math.max(1, Math.round(listPriceTry * multiplier));

  return {
    priceTry: discountedPrice,
    compareAtTry: listPriceTry,
    discountPercent,
    isWithinTrialWindow,
    trialDaysRemaining,
    trialDays: SUBSCRIPTION_TRIAL_DAYS,
    campaignActive: true as const,
  };
}

export function applyPromoCode(listPriceTry: number, code: string, isWithinTrialWindow: boolean) {
  if (code.trim().toUpperCase() === "ZIGO50" && isWithinTrialWindow) {
    const discountedPrice = Math.max(1, Math.round(listPriceTry * 0.5));
    return {
      success: true,
      priceTry: discountedPrice,
      message: "Promosyon kodu uygulandı! %50 indirim kazandınız.",
    };
  }
  if (code.trim().toUpperCase() === "ZIGO50" && !isWithinTrialWindow) {
    return {
      success: false,
      priceTry: listPriceTry,
      message: "Bu kod yalnızca kayıttan sonraki ilk 7 gün içinde geçerlidir.",
    };
  }
  return {
    success: false,
    priceTry: listPriceTry,
    message: "Geçersiz promosyon kodu.",
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
  if (discountPercent > 0) {
    return process.env.STRIPE_COUPON_15OFF?.trim() || "zigo-15off";
  }
  return null;
}

