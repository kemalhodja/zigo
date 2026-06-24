"use client";

import Link from "next/link";

import { useMessages } from "@/lib/i18n/locale-context";

export function LegalFooter() {
  const t = useMessages().legal;

  return (
    <footer className="safe-bottom border-t border-slate-100 bg-white px-4 py-3 text-center text-zigo-caption font-semibold leading-relaxed text-slate-600">
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
        <Link href="/legal/privacy">{t.privacy}</Link>
        <Link href="/legal/terms">{t.terms}</Link>
        <Link href="/legal/kvkk">{t.kvkk}</Link>
        <Link href="/legal/delete-account">{t.dataDelete}</Link>
        <Link href="/setup">{t.setup}</Link>
      </div>
      <p className="mt-1">{t.tagline}</p>
    </footer>
  );
}
