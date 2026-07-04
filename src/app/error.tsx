"use client";

import { useEffect } from "react";

import { GlobalErrorContent } from "@/components/global-error-content";
import { getHtmlLang, getLocale } from "@/lib/i18n/locale";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang={getHtmlLang(getLocale())}>
      <body className="font-sans antialiased">
        <GlobalErrorContent reset={reset} />
      </body>
    </html>
  );
}
