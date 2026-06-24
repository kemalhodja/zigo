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
