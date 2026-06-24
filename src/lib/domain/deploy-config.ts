export function getSiteUrl(fallback = "http://localhost:3000") {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "");
    return `https://${host}`;
  }

  return fallback.replace(/\/$/, "");
}

export function usesVercelFallbackUrl() {
  return !process.env.NEXT_PUBLIC_SITE_URL?.trim() && Boolean(process.env.VERCEL_URL?.trim());
}

export function hasSiteUrlConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SITE_URL?.trim());
}

export function isLocalSiteUrl(url: string) {
  try {
    const { hostname } = new URL(url);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return true;
  }
}

export function isProductionSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return configured ? !isLocalSiteUrl(configured) : false;
}

export function getAuthCallbackUrl(siteUrl = getSiteUrl()) {
  return new URL("/auth/callback", siteUrl).toString();
}

export function getSupabaseRedirectUrls(siteUrl = getSiteUrl()) {
  const callback = getAuthCallbackUrl(siteUrl);
  return {
    callback,
    onboarding: new URL("/auth/callback?next=/onboarding", siteUrl).toString(),
    siteUrl,
  };
}

export function getStripeWebhookUrl(siteUrl = getSiteUrl()) {
  return new URL("/api/billing/webhook", siteUrl).toString();
}

export function getBillingSuccessUrl(siteUrl = getSiteUrl()) {
  return new URL("/billing/success", siteUrl).toString();
}

export function isStagingProductionUrl() {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!url) return false;
  try {
    const { hostname } = new URL(url);
    return !isLocalSiteUrl(url) && (hostname.includes("vercel.app") || hostname.includes("staging"));
  } catch {
    return false;
  }
}
