import {
  getSubscriptionCampaignStripeCouponId,
  isSubscriptionCampaignActive,
  SUBSCRIPTION_CAMPAIGN,
} from "@/lib/domain/subscription-campaign";

const REDEEM_BY_UNIX = Math.floor(new Date("2026-07-31T23:59:59+03:00").getTime() / 1000);

type StripeCoupon = {
  id: string;
  percent_off?: number;
  redeem_by?: number;
};

type StripePromotionCode = {
  id: string;
  code: string;
  active: boolean;
};

function resolveStripeSecret(explicit?: string) {
  const secret = explicit?.trim() || process.env.STRIPE_SECRET_KEY?.trim() || "";
  if (!secret || secret.includes("...")) return "";
  if (!/^sk_(live|test)_[A-Za-z0-9]+$/.test(secret) || secret.length < 20) return "";
  return secret;
}

async function stripeRequest<T>(
  secret: string,
  method: "GET" | "POST",
  path: string,
  params?: URLSearchParams,
): Promise<T> {
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params?.toString() || undefined,
  });

  const payload = (await response.json()) as T & { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(payload.error?.message ?? `Stripe ${method} ${path} failed`);
  }
  return payload;
}

export async function ensureStripeCampaignCoupon(secretInput?: string) {
  const secret = resolveStripeSecret(secretInput);
  if (!secret) {
    throw new Error("STRIPE_SECRET_KEY yapılandırılmadı.");
  }

  const couponId = getSubscriptionCampaignStripeCouponId();
  let coupon: StripeCoupon;

  try {
    coupon = await stripeRequest<StripeCoupon>(secret, "GET", `/coupons/${couponId}`);
  } catch {
    const params = new URLSearchParams({
      id: couponId,
      name: "Zigo Yaz 2026 %75",
      percent_off: String(SUBSCRIPTION_CAMPAIGN.discountPercent),
      duration: "once",
      redeem_by: String(REDEEM_BY_UNIX),
      "metadata[campaign_id]": SUBSCRIPTION_CAMPAIGN.id,
    });
    coupon = await stripeRequest<StripeCoupon>(secret, "POST", "/coupons", params);
  }

  const promotionList = await stripeRequest<{ data?: StripePromotionCode[] }>(
    secret,
    "GET",
    `/promotion_codes?code=${encodeURIComponent(SUBSCRIPTION_CAMPAIGN.stripePromotionCode)}&limit=1`,
  );

  const existingCode = promotionList.data?.find(
    (item) => item.code === SUBSCRIPTION_CAMPAIGN.stripePromotionCode && item.active,
  );

  if (!existingCode) {
    await stripeRequest<StripePromotionCode>(
      secret,
      "POST",
      "/promotion_codes",
      new URLSearchParams({
        coupon: coupon.id,
        code: SUBSCRIPTION_CAMPAIGN.stripePromotionCode,
        active: "true",
        "metadata[campaign_id]": SUBSCRIPTION_CAMPAIGN.id,
      }),
    );
  }

  return {
    couponId: coupon.id,
    percentOff: coupon.percent_off ?? SUBSCRIPTION_CAMPAIGN.discountPercent,
    promotionCode: SUBSCRIPTION_CAMPAIGN.stripePromotionCode,
    mode: secret.startsWith("sk_live_") ? ("live" as const) : ("test" as const),
  };
}

export function getStripeCampaignProvisionStatus() {
  const secret = resolveStripeSecret();
  return {
    campaignActive: isSubscriptionCampaignActive(),
    stripeKeyConfigured: Boolean(secret),
    couponId: getSubscriptionCampaignStripeCouponId(),
    promotionCode: SUBSCRIPTION_CAMPAIGN.stripePromotionCode,
    campaignEndsAt: SUBSCRIPTION_CAMPAIGN.endsAt.toISOString(),
    discountPercent: SUBSCRIPTION_CAMPAIGN.discountPercent,
  };
}
