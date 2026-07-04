"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export function useRecaptcha(action: string) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim() ?? "";
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!siteKey) return;

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-zigo-recaptcha="true"]');
    if (existingScript) {
      window.grecaptcha?.ready(() => setReady(true));
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    script.dataset.zigoRecaptcha = "true";
    script.onload = () => {
      window.grecaptcha?.ready(() => setReady(true));
    };
    document.head.appendChild(script);
  }, [siteKey]);

  async function getToken() {
    if (!siteKey || !window.grecaptcha) {
      return null;
    }

    return window.grecaptcha.execute(siteKey, { action });
  }

  return {
    siteKey,
    ready,
    enabled: Boolean(siteKey),
    getToken,
  };
}
