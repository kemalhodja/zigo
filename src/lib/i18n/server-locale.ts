import { cookies, headers } from "next/headers";
import { cache } from "react";

import { type Locale, LOCALE_COOKIE, parseLocale, parseLocaleFromHeaders } from "./locale";

export const getServerLocale = cache(async (): Promise<Locale> => {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(LOCALE_COOKIE)?.value;

  // 1. Saved user preference (cookie)
  if (cookieValue === "tr" || cookieValue === "en") {
    return parseLocale(cookieValue);
  }

  // 2. Auto-detect from request headers (geo-IP or Accept-Language)
  const requestHeaders = await headers();
  return parseLocaleFromHeaders(requestHeaders);
});

