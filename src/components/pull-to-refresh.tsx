"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const PULL_THRESHOLD = 72;
const MAX_PULL = 110;

export function PullToRefresh() {
  const router = useRouter();
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = document.getElementById("main-content");
    if (!el) return;

    function onTouchStart(e: TouchEvent) {
      const scrollTop = el!.scrollTop ?? window.scrollY;
      if (scrollTop > 2) return;
      startYRef.current = e.touches[0].clientY;
      isDraggingRef.current = false;
    }

    function onTouchMove(e: TouchEvent) {
      if (startYRef.current === null) return;
      const dy = e.touches[0].clientY - startYRef.current;
      if (dy <= 0) {
        startYRef.current = null;
        return;
      }
      isDraggingRef.current = true;
      const clamped = Math.min(dy * 0.45, MAX_PULL);
      setPullY(clamped);
      if (clamped > 2) e.preventDefault();
    }

    function onTouchEnd() {
      if (!isDraggingRef.current) {
        startYRef.current = null;
        setPullY(0);
        return;
      }

      const triggered = pullY >= PULL_THRESHOLD;
      startYRef.current = null;
      isDraggingRef.current = false;

      if (triggered) {
        setIsRefreshing(true);
        setPullY(PULL_THRESHOLD * 0.65);
        router.refresh();
        window.setTimeout(() => {
          setIsRefreshing(false);
          setPullY(0);
        }, 1400);
      } else {
        setPullY(0);
      }
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [pullY, router]);

  const progress = Math.min(pullY / PULL_THRESHOLD, 1);
  const isReady = pullY >= PULL_THRESHOLD;

  if (pullY < 2 && !isRefreshing) return null;

  return (
    <div
      ref={containerRef}
      aria-live="polite"
      className="pointer-events-none fixed left-1/2 z-50 flex -translate-x-1/2 items-center justify-center transition-all duration-200"
      style={{ top: `${Math.max(pullY - 20, 48)}px` }}
    >
      <div
        className={`flex size-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-lg transition-transform duration-200 ${isRefreshing ? "scale-100" : ""}`}
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
      {isReady && !isRefreshing ? (
        <span className="ml-2 text-xs font-black text-crystal">Yenile</span>
      ) : isRefreshing ? (
        <span className="ml-2 text-xs font-black text-slate-500">Yenileniyor…</span>
      ) : null}
    </div>
  );
}
