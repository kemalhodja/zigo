"use client";

import { useEffect } from "react";

const storageKey = "zigo:store-visit-day";

export function StoreVisitTracker() {
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    window.localStorage.setItem(storageKey, today);
    void fetch("/api/learning/store-visit", { method: "POST" }).catch(() => undefined);
  }, []);

  return null;
}

export function readStoreVisitedToday() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(storageKey) === new Date().toISOString().slice(0, 10);
  } catch {
    return false;
  }
}
