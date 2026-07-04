"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { useMessages } from "@/lib/i18n/locale-context";

type FeedRefreshControlProps = {
  activeFeed: "following" | "for-you";
};

export function FeedRefreshControl({ activeFeed }: FeedRefreshControlProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const f = useMessages().feed;
  const [message, setMessage] = useState<string>(
    activeFeed === "following" ? f.followingReady : f.forYouReady,
  );

  function refreshFeed() {
    setMessage(f.checking);
    startTransition(() => {
      router.refresh();
      window.setTimeout(() => {
        setMessage(activeFeed === "following" ? f.followingRefreshed : f.forYouRefreshed);
      }, 450);
    });
  }

  return (
    <section className="-mx-4 border-b border-slate-100 bg-white/98 px-4 py-2 backdrop-blur">
      <div className="relative flex items-center justify-center gap-2 text-sm font-black">
        <Link
          className={`rounded-full border px-4 py-1.5 transition ${
            activeFeed === "for-you"
              ? "zigo-tab-active-pill shadow-sm"
              : "zigo-tab-inactive-pill"
          }`}
          href="/"
        >
          {f.forYou}
        </Link>
        <Link
          className={`rounded-full border px-4 py-1.5 transition ${
            activeFeed === "following"
              ? "zigo-tab-active-pill shadow-sm"
              : "zigo-tab-inactive-pill"
          }`}
          href="/?feed=following"
        >
          {f.following}
        </Link>
        <button
          aria-label={isPending ? f.refreshing : f.refresh}
          className="tap-scale absolute right-4 flex size-8 items-center justify-center rounded-full text-crystal disabled:opacity-60"
          disabled={isPending}
          onClick={refreshFeed}
          type="button"
        >
          <span className="sr-only">{message}</span>
          <svg aria-hidden="true" className={`size-4 ${isPending ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M20 12a8 8 0 1 1-2.34-5.66" />
            <path d="M20 4v6h-6" />
          </svg>
        </button>
        <Link className="sr-only" href="/questions">
          {f.askSafely}
        </Link>
      </div>
    </section>
  );
}
