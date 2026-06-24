"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useMessages } from "@/lib/i18n/locale-context";

const storageKey = "zigo:cookie-consent";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const t = useMessages().cookie;

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(storageKey) !== "accepted");
    } catch {
      setVisible(true);
    }
  }, []);

  function accept() {
    try {
      window.localStorage.setItem(storageKey, "accepted");
    } catch {
      // ignore
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="safe-bottom fixed inset-x-0 bottom-14 z-50 mx-auto max-w-md px-3 md:bottom-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
        <p className="text-xs font-bold leading-5 text-slate-600">
          {t.body}{" "}
          <Link className="font-black text-crystal" href="/legal/privacy">
            {t.privacy}
          </Link>{" "}
          {t.and}{" "}
          <Link className="font-black text-crystal" href="/legal/kvkk">
            KVKK
          </Link>
          .
        </p>
        <button
          className="zigo-cta mt-3 w-full rounded-lg px-4 py-2 text-xs font-black text-white"
          onClick={accept}
          type="button"
        >
          {t.accept}
        </button>
      </div>
    </div>
  );
}
