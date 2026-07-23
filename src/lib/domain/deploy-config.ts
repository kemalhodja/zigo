/** Known-good Vercel deployment while custom domain DNS/TLS is repaired. */
export const ZIGO_HOSTED_FALLBACK_URL = "https://zigo-kohl.vercel.app";

/** Canonical custom domain — must resolve to Vercel with a valid TLS cert. */
export const ZIGO_CANONICAL_DOMAIN = "https://zigo.app";

/**
 * When true (default), auth/billing redirects never point at zigo.app while its
 * GoDaddy parking DNS still causes ERR_CONNECTION_CLOSED. Set
 * ZIGO_USE_CANONICAL_DOMAIN=1 after Vercel TLS for zigo.app is Valid.
 */
export function shouldBypassBrokenCanonicalDomain() {
  return process.env.ZIGO_USE_CANONICAL_DOMAIN !== "1";
}

export function isBrokenCustomDomainHost(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "zigo.app" || host === "www.zigo.app";
  } catch {
    return false;
  }
}

export function getSiteUrl(fallback = "http://localhost:3000") {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    const normalized = configured.replace(/\/$/, "");
    if (shouldBypassBrokenCanonicalDomain() && isBrokenCustomDomainHost(normalized)) {
      return ZIGO_HOSTED_FALLBACK_URL;
    }
    return normalized;
  }

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

export function usesCanonicalDomainBypass() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) return false;
  return shouldBypassBrokenCanonicalDomain() && isBrokenCustomDomainHost(configured);
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

/**
 * Probes whether NEXT_PUBLIC_SITE_URL answers over HTTPS.
 * Any HTTP status means TCP+TLS succeeded (redirects/auth walls are fine).
 * Connection reset / SSL_ERROR_SYSCALL maps to browser ERR_CONNECTION_CLOSED.
 */
export async function probeSiteOriginReachable(
  siteUrl: string,
  options?: { timeoutMs?: number },
): Promise<{ ok: boolean; detail: string; hint?: string }> {
  const normalized = siteUrl.trim().replace(/\/$/, "");
  if (!normalized || isLocalSiteUrl(normalized)) {
    return {
      ok: true,
      detail: "Local site URL — reachability probe skipped.",
    };
  }

  const timeoutMs = options?.timeoutMs ?? 5000;
  try {
    const response = await fetch(normalized, {
      method: "GET",
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
      headers: { Accept: "text/html,*/*" },
    });

    if (response.status > 0) {
      return {
        ok: true,
        detail: `Site origin reachable (HTTP ${response.status}).`,
      };
    }

    return {
      ok: false,
      detail: "Site origin returned an empty response.",
      hint: `Point DNS for the custom domain at Vercel, or set NEXT_PUBLIC_SITE_URL / CAPACITOR_SERVER_URL to ${ZIGO_HOSTED_FALLBACK_URL}.`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      detail: `Site origin unreachable: ${message}`,
      hint: `Browser shows ERR_CONNECTION_CLOSED when TLS fails. Fix DNS/SSL for the domain, or use ${ZIGO_HOSTED_FALLBACK_URL} until DNS points at Vercel.`,
    };
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
