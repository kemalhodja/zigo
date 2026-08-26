"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Her sayfa değişiminde pencereyi en üste sıfırlar ve tarayıcının eski
 * kaydırma konumunu geri yüklemesini (scroll restoration) kapatır.
 */
export function ScrollReset() {
  const pathname = usePathname();

  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  return null;
}
