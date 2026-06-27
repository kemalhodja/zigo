/** Yaz kampanyası: 1 Ağustos 2026 (dahil değil) tarihine kadar tüm aboneliklerde %75 indirim. */

export const SUBSCRIPTION_CAMPAIGN = {
  id: "yaz-2026-75",
  discountPercent: 75,
  /** Kampanya son günü dahil — 31 Temmuz 2026 23:59:59 TR */
  endsAt: new Date("2026-08-01T00:00:00+03:00"),
  badgeLabel: "%75 indirim",
  headline: "Yaz kampanyası",
  description: "1 Ağustos 2026'ya kadar tüm abonelik planlarında %75 indirim.",
  stripeCouponId: "zigo-yaz-2026-75off",
  stripePromotionCode: "YAZ75",
  stripeCouponEnvKey: "STRIPE_COUPON_CAMPAIGN_75OFF",
} as const;

export function isSubscriptionCampaignActive(now = new Date()) {
  return now.getTime() < SUBSCRIPTION_CAMPAIGN.endsAt.getTime();
}

export function applySubscriptionCampaignPrice(listPriceTry: number, now = new Date()) {
  if (!isSubscriptionCampaignActive(now)) return listPriceTry;
  const multiplier = (100 - SUBSCRIPTION_CAMPAIGN.discountPercent) / 100;
  return Math.max(1, Math.round(listPriceTry * multiplier));
}

export function resolveSubscriptionPlanPricing(listPriceTry: number, now = new Date()) {
  if (!isSubscriptionCampaignActive(now)) {
    return {
      priceTry: listPriceTry,
      compareAtTry: listPriceTry * 3,
      campaignActive: false as const,
    };
  }

  return {
    priceTry: applySubscriptionCampaignPrice(listPriceTry, now),
    compareAtTry: listPriceTry,
    campaignActive: true as const,
  };
}

export function getSubscriptionCampaignStripeCouponId() {
  const fromEnv = process.env[SUBSCRIPTION_CAMPAIGN.stripeCouponEnvKey]?.trim();
  return fromEnv || SUBSCRIPTION_CAMPAIGN.stripeCouponId;
}
