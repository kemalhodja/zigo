"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const PULL_THRESHOLD = 76;
const MAX_PULL = 110;

function getScrollTop(): number {
  if (typeof window === "undefined") return 0;
  const mainEl = document.getElementById("main-content");
  const mainScroll = mainEl ? mainEl.scrollTop : 0;
  const docScroll = document.documentElement?.scrollTop || document.body?.scrollTop || 0;
  const winScroll = window.scrollY || 0;

  return Math.max(mainScroll, docScroll, winScroll);
}

export function PullToRefresh() {
  const router = useRouter();
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      if (isRefreshing) return;

      // Sadece sayfa EN ÜSTTE iken (scrollTop === 0) tetiklenmeli
      if (getScrollTop() > 0) {
        startYRef.current = null;
        isDraggingRef.current = false;
        return;
      }

      startYRef.current = e.touches[0].clientY;
      isDraggingRef.current = false;
    }

    function onTouchMove(e: TouchEvent) {
      if (startYRef.current === null || isRefreshing) return;

      // Hareket esnasında dahi sayfa 0'dan kaydırılmışsa pull-to-refresh'i iptal et
      if (getScrollTop() > 0) {
        startYRef.current = null;
        isDraggingRef.current = false;
        setPullY(0);
        return;
      }

      const dy = e.touches[0].clientY - startYRef.current;
      if (dy <= 0) {
        setPullY(0);
        return;
      }

      isDraggingRef.current = true;
      const clamped = Math.min(dy * 0.4, MAX_PULL);
      setPullY(clamped);

      // Sayfa en üstteyken aşağı sürüklendiğinde yerel kaydırmayı engelle
      if (clamped > 5 && e.cancelable) {
        e.preventDefault();
      }
    }

    function onTouchEnd() {
      if (startYRef.current === null || !isDraggingRef.current) {
        startYRef.current = null;
        isDraggingRef.current = false;
        setPullY(0);
        return;
      }

      const currentPull = pullY;
      startYRef.current = null;
      isDraggingRef.current = false;

      if (currentPull >= PULL_THRESHOLD && !isRefreshing) {
        setIsRefreshing(true);
        setPullY(PULL_THRESHOLD * 0.65);
        router.refresh();
        window.setTimeout(() => {
          setIsRefreshing(false);
          setPullY(0);
        }, 1200);
      } else {
        setPullY(0);
      }
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [pullY, isRefreshing, router]);

  const progress = Math.min(pullY / PULL_THRESHOLD, 1);

  if (pullY < 2 && !isRefreshing) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed left-1/2 z-50 flex -translate-x-1/2 flex-col items-center justify-center gap-2 transition-all duration-300 ease-out"
      style={{ top: `${Math.max(pullY - 15, 60)}px` }}
    >
      <div
        className={`flex size-10 items-center justify-center rounded-full border border-slate-100 bg-white/90 shadow-lg backdrop-blur-md ring-1 ring-black/5 transition-all duration-300 ${
          isRefreshing ? "scale-100 animate-pulse" : ""
        }`}
        style={{ transform: `scale(${0.5 + progress * 0.5})`, opacity: progress }}
      >
        <svg
          aria-hidden="true"
          className={`size-5 text-crystal ${isRefreshing ? "animate-spin" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          style={
            !isRefreshing
              ? { transform: `rotate(${progress * 360}deg)`, transition: "none" }
              : undefined
          }
          viewBox="0 0 24 24"
        >
          <path d="M20 12a8 8 0 1 1-2.34-5.66" />
          <path d="M20 4v6h-6" />
        </svg>
      </div>
    </div>
  );
}
