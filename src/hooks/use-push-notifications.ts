import { useEffect, useState } from "react";
import OneSignal from "react-onesignal";

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsSupported(OneSignal.Notifications?.isPushSupported() ?? false);
      setIsSubscribed(OneSignal.User?.PushSubscription?.optedIn ?? false);
    }
  }, []);

  const subscribe = async () => {
    try {
      await OneSignal.Slidedown.promptPush();
      setIsSubscribed(OneSignal.User?.PushSubscription?.optedIn ?? false);
    } catch (err) {
      console.error("Failed to subscribe to push notifications", err);
    }
  };

  return {
    isSupported,
    isSubscribed,
    subscription: null,
    subscribe,
  };
}
