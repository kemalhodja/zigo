"use client";

import { useRouter } from "next/navigation";
import { createContext, type ReactNode,useContext, useMemo, useState } from "react";

import type { Locale } from "./locale";
import { messagesEn } from "./messages.en";
import { messagesTr } from "./messages.tr";
import type { Messages } from "./types";

type LocaleContextValue = {
  locale: Locale;
  messages: Messages;
  setLocale: (locale: Locale) => Promise<void>;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const messages = useMemo(() => (locale === "en" ? messagesEn : messagesTr), [locale]);

  async function setLocale(next: Locale) {
    if (next === locale) return;
    setLocaleState(next);
    await fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: next }),
    });
    router.refresh();
  }

  const value = useMemo(() => ({ locale, messages, setLocale }), [locale, messages]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocaleContext() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocaleContext must be used within LocaleProvider");
  }
  return ctx;
}

export function useMessages(): Messages {
  return useLocaleContext().messages;
}

export function useLocale(): Locale {
  return useLocaleContext().locale;
}

export function useSetLocale() {
  return useLocaleContext().setLocale;
}
