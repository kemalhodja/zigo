"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { useMessages } from "@/lib/i18n/locale-context";

type LegalLayoutProps = {
  title: string;
  children: ReactNode;
};

export function LegalLayout({ title, children }: LegalLayoutProps) {
  const c = useMessages().common;

  return (
    <div className="space-y-4 pb-6">
      <section className="-mx-4 sm:mx-0 border-b border-slate-100 bg-white px-4 pb-4 sm:rounded-2xl sm:border sm:shadow-xs sm:p-5">
        <Link className="text-xs font-black text-crystal" href="/">
          {c.backToZigo}
        </Link>
        <h1 className="mt-3 text-2xl font-black text-night">{title}</h1>
        <p className="mt-2 text-sm font-semibold text-slate-500">{c.lastUpdated}</p>
      </section>
      <article className="space-y-4 text-sm leading-7 text-slate-700 bg-white sm:rounded-2xl sm:border sm:border-slate-100 sm:p-6 sm:shadow-xs">{children}</article>
    </div>
  );
}
