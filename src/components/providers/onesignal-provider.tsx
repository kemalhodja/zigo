"use client";

import { useEffect, useRef } from "react";

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || "";

type OneSignalProviderProps = {
  userId?: string;
  userRole?: string;
};

export function OneSignalProvider({ userId, userRole }: OneSignalProviderProps) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current || !ONESIGNAL_APP_ID || typeof window === "undefined") return;
    initialized.current = true;

    async function initOneSignal() {
      try {
        const OneSignalModule = await import("react-onesignal");
        const OneSignal = OneSignalModule.default;

        await OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          allowLocalhostAsSecureOrigin: process.env.NODE_ENV === "development",
          serviceWorkerParam: { scope: "/push/onesignal/" },
          serviceWorkerPath: "/OneSignalSDKWorker.js",
        });

        if (userId) {
          await OneSignal.login(userId);
        }

        if (userRole) {
          await OneSignal.User.addTag("role", userRole);
        }
      } catch (err) {
        console.error("[ONESIGNAL_INIT_ERROR]", err);
      }
    }

    initOneSignal();
  }, [userId, userRole]);

  return null;
}
