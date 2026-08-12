"use client";

import { BellRing } from "lucide-react";

import { usePushNotifications } from "@/hooks/use-push-notifications";

export function PushNotificationPrompt() {
  const { isSupported, isSubscribed, subscribe } = usePushNotifications();

  if (!isSupported || isSubscribed) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 p-4 shadow-lg">
      <div className="absolute -right-4 -top-4 opacity-10">
        <BellRing className="h-24 w-24" />
      </div>
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-white">Bildirimleri Aç</h3>
          <p className="mt-1 text-xs font-medium text-blue-100">
            Düello ve beğenileri kaçırma!
          </p>
        </div>
        <button
          onClick={subscribe}
          className="tap-scale rounded-lg bg-white px-4 py-2 text-xs font-black text-indigo-600 shadow hover:bg-blue-50"
        >
          İzin Ver
        </button>
      </div>
    </div>
  );
}
