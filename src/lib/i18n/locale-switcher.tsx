"use client";

import { useLocale, useSetLocale } from "./locale-context";

export function LocaleSwitcher({ compact = false }: { compact?: boolean }) {
  const locale = useLocale();
  const setLocale = useSetLocale();

  return (
    <div
      aria-label="Dil seçimi"
      className={`inline-flex items-center rounded-full border border-slate-200 bg-white p-0.5 text-[0.62rem] font-black uppercase tracking-[0.06em] ${
        compact ? "scale-90" : ""
      }`}
      role="group"
    >
      <button
        aria-pressed={locale === "tr"}
        className={`rounded-full px-2.5 py-1 transition ${
          locale === "tr" ? "bg-crystal text-white shadow-sm" : "text-slate-500 hover:text-night"
        }`}
        onClick={() => void setLocale("tr")}
        type="button"
      >
        TR
      </button>
      <button
        aria-pressed={locale === "en"}
        className={`rounded-full px-2.5 py-1 transition ${
          locale === "en" ? "bg-crystal text-white shadow-sm" : "text-slate-500 hover:text-night"
        }`}
        onClick={() => void setLocale("en")}
        type="button"
      >
        EN
      </button>
    </div>
  );
}
