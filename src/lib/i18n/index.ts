import type { Locale } from "./locale";
import { getLocale } from "./locale";
import { messagesEn } from "./messages.en";
import { messagesTr } from "./messages.tr";
import type { Messages } from "./types";

export { getHtmlLang, getLocale, type Locale,LOCALE_COOKIE, parseLocale } from "./locale";
export { LocaleProvider, useLocale, useMessages, useSetLocale } from "./locale-context";
export { LocaleSwitcher } from "./locale-switcher";
export type { Messages } from "./types";

export function getMessages(locale?: Locale): Messages {
  const resolved = locale ?? getLocale();
  return resolved === "en" ? messagesEn : messagesTr;
}

export function getZigoLabelsFromMessages(messages: Messages = getMessages()) {
  return messages.zigo;
}
