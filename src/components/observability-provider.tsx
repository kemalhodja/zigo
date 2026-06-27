"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { trackPageView } from "@/lib/client/analytics";
import { reportClientError } from "@/lib/client/sentry-report";

export function ObservabilityProvider() {
  const pathname = usePathname();

  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  useEffect(() => {
    function onError(event: ErrorEvent) {
      reportClientError(event.error ?? event.message, { pathname: window.location.pathname });
    }

    function onRejection(event: PromiseRejectionEvent) {
      reportClientError(event.reason, { pathname: window.location.pathname, type: "unhandledrejection" });
    }

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
