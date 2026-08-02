export type Locale = "tr" | "en";

export const LOCALE_COOKIE = "zigo_locale";

export function parseLocale(value?: string | null): Locale {
  const raw = value?.trim().toLowerCase();
  if (raw === "en") return "en";
  if (raw === "tr") return "tr";
  const env = process.env.NEXT_PUBLIC_LOCALE?.trim().toLowerCase();
  return env === "en" ? "en" : "tr";
}

export function getLocale(): Locale {
  return parseLocale(process.env.NEXT_PUBLIC_LOCALE);
}

export function getHtmlLang(locale: Locale = getLocale()) {
  return locale === "tr" ? "tr" : "en";
}

export function readLocaleCookie(cookieHeader?: string | null): Locale | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=(tr|en)`));
  return match?.[1] === "en" ? "en" : match?.[1] === "tr" ? "tr" : null;
}

/**
 * Infer locale from request headers (no cookie present).
 *
 * Priority:
 *  1. Vercel edge geo header: `x-vercel-ip-country` → TR → "tr", else "en"
 *  2. Browser `Accept-Language` header first tag → "tr*" → "tr", else "en"
 *  3. Fallback: env default ("tr")
 */
export function parseLocaleFromHeaders(headers: Headers): Locale {
  // 1. Vercel / Cloudflare country geo
  const country = headers.get("x-vercel-ip-country") ?? headers.get("cf-ipcountry");
  if (country) {
    return country.toUpperCase() === "TR" ? "tr" : "en";
  }

  // 2. Accept-Language (e.g. "tr-TR,tr;q=0.9,en;q=0.8")
  const acceptLang = headers.get("accept-language");
  if (acceptLang) {
    const primary = acceptLang.split(",")[0]?.trim().toLowerCase() ?? "";
    if (primary.startsWith("tr")) return "tr";
    if (primary.startsWith("en")) return "en";
  }

  // 3. Env / hard-coded default
  return parseLocale(null);
}

