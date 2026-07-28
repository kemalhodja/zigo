/** Yaz kampanyası ve Abonelik Fiyatlandırma Motoru */

export const SUBSCRIPTION_CAMPAIGN = {
  id: "yaz-2026-75",
  discountPercent: 75,
  endsAt: new Date("2026-08-01T00:00:00+03:00"),
  badgeLabel: "İlk 30 Gün Ücretsiz",
  headline: "Deneme Sürümü ve İndirim",
  description: "30 günlük ücretsiz deneme (Trial) fırsatı. Deneme sonrasında tüm abonelik planlarında kademeli %75 indirim.",
  stripeCouponId: "zigo-yaz-2026-75off",
  stripePromotionCode: "YAZ75",
  stripeCouponEnvKey: "STRIPE_COUPON_CAMPAIGN_75OFF",
  trialDays: 30, // 30-Day Trial engine added
} as const;

export function isSubscriptionCampaignActive(now = new Date()) {
  return now.getTime() < SUBSCRIPTION_CAMPAIGN.endsAt.getTime();
}

/** 
 * Calculate price engine 
 * Dinamik fiyatlandırma ve kademeli indirim hesaplama motoru.
 */
export function calculatePrice(listPriceTry: number, hasTrial: boolean = true, now = new Date()) {
  if (!isSubscriptionCampaignActive(now)) {
    return {
      priceTry: listPriceTry,
      compareAtTry: listPriceTry * 3,
      hasTrial: false,
      trialDays: 0,
      campaignActive: false as const,
    };
  }

  const multiplier = (100 - SUBSCRIPTION_CAMPAIGN.discountPercent) / 100;
  const discounted = Math.max(1, Math.round(listPriceTry * multiplier));

  return {
    priceTry: discounted,
    compareAtTry: listPriceTry,
    hasTrial: hasTrial,
    trialDays: hasTrial ? SUBSCRIPTION_CAMPAIGN.trialDays : 0,
    campaignActive: true as const,
  };
}

export function resolveSubscriptionPlanPricing(listPriceTry: number, now = new Date()) {
  return calculatePrice(listPriceTry, true, now);
}

export function getSubscriptionCampaignStripeCouponId() {
  const fromEnv = process.env[SUBSCRIPTION_CAMPAIGN.stripeCouponEnvKey]?.trim();
  return fromEnv || SUBSCRIPTION_CAMPAIGN.stripeCouponId;
}
