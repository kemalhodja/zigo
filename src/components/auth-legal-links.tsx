"use client";

import Link from "next/link";

import { useMessages } from "@/lib/i18n/locale-context";

export function AuthLegalLinks() {
  const t = useMessages().legal;

  return (
    <p className="text-center text-[0.65rem] font-bold leading-5 text-slate-500">
      <Link className="font-black text-crystal" href="/legal/privacy">
        {t.privacy}
      </Link>
      {" · "}
      <Link className="font-black text-crystal" href="/legal/terms">
        {t.terms}
      </Link>
      {" · "}
      <Link className="font-black text-crystal" href="/legal/kvkk">
        {t.kvkk}
      </Link>
    </p>
  );
}
