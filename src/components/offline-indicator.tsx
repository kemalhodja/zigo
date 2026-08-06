"use client";

import { useEffect, useState } from "react";

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    function handleOnline() {
      setIsOffline(false);
    }
    function handleOffline() {
      setIsOffline(true);
    }

    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center bg-rose-600 px-4 py-2 text-xs font-black text-white shadow-lg animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full bg-white animate-ping" />
        <span>📶 İnternet Bağlantınız Kesildi · Çevrimdışı Modasınız (Yeniden Bağlanılıyor...)</span>
      </div>
    </div>
  );
}
