"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

/**
 * Scroll-to-top behaviour when the Zigo logo / home link is tapped.
 * Fires "zigo:logo-tap" on window; the Header <Link href="/"> already
 * navigates to "/" so we intercept repeated taps on the same route.
 */
export function ScrollToTopOnLogoTap() {
  const router = useRouter();

  const handleLogoTap = useCallback(() => {
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Also scroll the main content element if it exists
    const mainEl = document.getElementById("main-content");
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: "smooth" });
    }

    // Refresh feed data silently
    router.refresh();
  }, [router]);

  useEffect(() => {
    window.addEventListener("zigo:logo-tap", handleLogoTap);
    return () => window.removeEventListener("zigo:logo-tap", handleLogoTap);
  }, [handleLogoTap]);

  return null;
}
