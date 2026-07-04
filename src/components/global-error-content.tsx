"use client";

import Link from "next/link";

import { type Locale, LOCALE_COOKIE, parseLocale } from "@/lib/i18n/locale";

function readClientLocale(): Locale {
  if (typeof document === "undefined") return parseLocale();
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=(tr|en)`));
  return parseLocale(match?.[1]);
}

const fallbackGlobalError = {
  tr: {
    title: "Bir şeyler ters gitti",
    description: "Akış geçici olarak kullanılamıyor. Hesabın ve öğrenme ilerlemen güvende.",
    tryAgain: "Tekrar dene",
    backToFeed: "Akışa dön",
  },
  en: {
    title: "Something went wrong",
    description: "The feed is temporarily unavailable. Your account and learning progress are safe.",
    tryAgain: "Try again",
    backToFeed: "Back to feed",
  },
} as const;

export function GlobalErrorContent({ reset }: { reset: () => void }) {
  const locale = readClientLocale();
  const g = fallbackGlobalError[locale] ?? fallbackGlobalError.tr;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-6 py-10 text-center">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-crystal">Zigo</p>
      <h1 className="text-2xl font-black text-night">{g.title}</h1>
      <p className="text-sm font-semibold leading-6 text-slate-500">{g.description}</p>
      <div className="flex flex-col gap-2">
        <button
          className="zigo-cta tap-scale rounded-lg px-4 py-3 text-sm font-black text-white"
          onClick={reset}
          type="button"
        >
          {g.tryAgain}
        </button>
        <Link className="rounded-lg bg-slate-100 px-4 py-3 text-sm font-black text-night" href="/">
          {g.backToFeed}
        </Link>
      </div>
    </main>
  );
}
