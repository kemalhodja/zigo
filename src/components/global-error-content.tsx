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
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6 py-10 text-center">
      <span className="mx-auto flex size-24 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-500 to-red-600 shadow-xl shadow-red-500/20">
        <svg aria-hidden="true" className="size-12 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-500">Zigo</p>
        <h1 className="mt-2 text-2xl font-black text-night">{g.title}</h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{g.description}</p>
      </div>
      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <button
          className="tap-scale flex-1 rounded-xl bg-night px-6 py-3 text-sm font-black text-white shadow-lg shadow-night/25 transition hover:brightness-105"
          onClick={reset}
          type="button"
        >
          {g.tryAgain}
        </button>
        <Link className="tap-scale flex-1 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50" href="/">
          {g.backToFeed}
        </Link>
      </div>
    </main>
  );
}
