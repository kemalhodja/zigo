"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";
import { useRef, useState } from "react";

import { triggerHaptic } from "@/lib/client/haptics";

type DoubleTapLikeLinkProps = {
  children: ReactNode;
  href: string;
  initialLiked?: boolean;
  postId?: string;
  disableNavigation?: boolean;
  className?: string;
};

const doubleTapDelayMs = 280;

export function DoubleTapLikeLink({
  children,
  href,
  initialLiked = false,
  postId,
  disableNavigation = false,
  className = "",
}: DoubleTapLikeLinkProps) {
  const router = useRouter();
  const clickTimerRef = useRef<number | null>(null);
  const lastClickAtRef = useRef(0);
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [showBurst, setShowBurst] = useState(false);

  function clearClickTimer() {
    if (clickTimerRef.current) {
      window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
  }

  async function likeWithBurst() {
    clearClickTimer();
    triggerHaptic("double");
    setShowBurst(false);
    window.setTimeout(() => setShowBurst(true), 0);
    window.setTimeout(() => setShowBurst(false), 650);

    if (isLiked) return;
    setIsLiked(true);

    if (!postId) return;

    try {
      const response = await fetch("/api/social/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });

      if (!response.ok) {
        setIsLiked(false);
        return;
      }

      const payload = (await response.json()) as { data?: { is_liked?: boolean } };
      setIsLiked(Boolean(payload.data?.is_liked));
      router.refresh();
    } catch {
      setIsLiked(false);
    }
  }

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    const now = Date.now();

    if (now - lastClickAtRef.current < doubleTapDelayMs) {
      lastClickAtRef.current = 0;
      void likeWithBurst();
      return;
    }

    lastClickAtRef.current = now;
    clearClickTimer();
    if (!disableNavigation) {
      clickTimerRef.current = window.setTimeout(() => {
        router.push(href);
      }, doubleTapDelayMs);
    }
  }

  return (
    <Link
      aria-label="Open post, double tap to like"
      className={`group relative block ${className}`}
      href={href}
      onClick={handleClick}
      onDoubleClick={(event) => {
        event.preventDefault();
        void likeWithBurst();
      }}
    >
      {children}
      {showBurst ? (
        <span className="pointer-events-none absolute inset-0 grid place-items-center text-white">
          <svg
            aria-hidden="true"
            className="size-24 animate-[ping_0.65s_ease-out_1]"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
          </svg>
        </span>
      ) : null}
    </Link>
  );
}

// doubleTapDelayMs Double tap to like /api/social/likes
