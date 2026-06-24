"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";
import { useRef, useState } from "react";

type DoubleTapLikeLinkProps = {
  children: ReactNode;
  href: string;
  initialLiked?: boolean;
  postId?: string;
};

const doubleTapDelayMs = 280;

export function DoubleTapLikeLink({
  children,
  href,
  initialLiked = false,
  postId,
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
    clickTimerRef.current = window.setTimeout(() => {
      router.push(href);
    }, doubleTapDelayMs);
  }

  return (
    <Link
      aria-label="Open post, double tap to like"
      className="group relative block"
      href={href}
      onClick={handleClick}
      onDoubleClick={(event) => {
        event.preventDefault();
        void likeWithBurst();
      }}
    >
      {children}
      <span className="pointer-events-none absolute left-3 top-3 rounded-lg bg-black/35 px-2.5 py-1 text-[0.58rem] font-black uppercase tracking-[0.08em] text-white opacity-80 backdrop-blur md:opacity-0 md:group-hover:opacity-100">
        Double tap to like
      </span>
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
