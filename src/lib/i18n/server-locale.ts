import { cookies } from "next/headers";

import { type Locale,LOCALE_COOKIE, parseLocale } from "./locale";

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return parseLocale(cookieStore.get(LOCALE_COOKIE)?.value);
}
