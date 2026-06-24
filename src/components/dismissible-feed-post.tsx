"use client";

import { type ReactNode, useEffect, useState } from "react";

import { useMessages } from "@/lib/i18n/locale-context";

type DismissibleFeedPostProps = {
  children: ReactNode;
  postKey: string;
};

const storageKey = "zigo:not-interested-posts";

export function DismissibleFeedPost({ children, postKey }: DismissibleFeedPostProps) {
  const t = useMessages().feedTune;
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    setIsHidden(readHiddenPosts().includes(postKey));

    function handleTuneFeed(event: Event) {
      const detail = (event as CustomEvent<{ postKey?: string }>).detail;
      if (detail?.postKey === postKey) {
        setIsHidden(true);
      }
    }

    window.addEventListener("zigo:tune-feed", handleTuneFeed);
    return () => window.removeEventListener("zigo:tune-feed", handleTuneFeed);
  }, [postKey]);

  function undo() {
    const next = readHiddenPosts().filter((item) => item !== postKey);
    window.localStorage.setItem(storageKey, JSON.stringify(next));
    setIsHidden(false);
  }

  if (isHidden) {
    return (
      <section className="-mx-4 border-y border-dashed border-slate-200 bg-white p-5 text-center">
        <h3 className="text-sm font-black text-night">{t.postHidden}</h3>
        <p className="mt-1 text-xs font-bold text-slate-500">{t.postHiddenDesc}</p>
        <button className="tap-scale mt-3 zigo-cta tap-scale rounded-lg px-4 py-2 text-xs font-black text-white" onClick={undo} type="button">
          {t.undo}
        </button>
      </section>
    );
  }

  return children;
}

function readHiddenPosts() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}
