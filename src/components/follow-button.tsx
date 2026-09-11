"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useMessages } from "@/lib/i18n/locale-context";

type FollowButtonProps = {
  followingId?: string;
  sourcePostId?: string;
  initialFollowing?: boolean;
  initialIsRequested?: boolean;
  initialFollowersCount?: number;
  showCount?: boolean;
  variant?: "compact" | "default" | "overlay";
};

export function FollowButton({
  followingId,
  sourcePostId,
  initialFollowersCount,
  initialFollowing = false,
  initialIsRequested = false,
  showCount = false,
  variant = "default",
}: FollowButtonProps) {
  const m = useMessages();
  const a = m.actions;
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isRequested, setIsRequested] = useState(initialIsRequested);
  const [followersCount, setFollowersCount] = useState(initialFollowersCount);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsFollowing(initialFollowing);
  }, [initialFollowing]);

  useEffect(() => {
    setIsRequested(initialIsRequested);
  }, [initialIsRequested]);

  useEffect(() => {
    if (!followingId) return;

    const handleGlobalFollowChange = (
      e: CustomEvent<{ followingId: string; isFollowing: boolean; isRequested?: boolean; count?: number }>,
    ) => {
      if (e.detail.followingId === followingId) {
        setIsFollowing(e.detail.isFollowing);
        setIsRequested(Boolean(e.detail.isRequested));
        if (typeof e.detail.count === "number") {
          setFollowersCount(e.detail.count);
        }
      }
    };

    window.addEventListener("zigo:follow-change", handleGlobalFollowChange as EventListener);
    return () => {
      window.removeEventListener("zigo:follow-change", handleGlobalFollowChange as EventListener);
    };
  }, [followingId]);

  async function toggleFollow() {
    if (isSaving) return;

    if (!followingId) {
      setIsFollowing((current) => !current);
      setFollowersCount((current) => typeof current === "number" ? current + (isFollowing ? -1 : 1) : current);
      setMessage(a.previewFollow);
      return;
    }

    setIsSaving(true);

    try {
      const payloadObj: { followingId: string; sourcePostId?: string } = { followingId };
      if (sourcePostId) {
        payloadObj.sourcePostId = sourcePostId;
      }
      
      const response = await fetch("/api/social/follows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadObj),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setMessage(response.status === 401 ? m.forms.signInFollow : payload?.error ?? a.followFailed);
        return;
      }

      const payload = (await response.json()) as {
        data: { followers_count?: number; following_count?: number; is_following: boolean; is_requested?: boolean };
      };
      const nextFollowing = payload.data.is_following;
      const nextRequested = Boolean(payload.data.is_requested);
      setIsFollowing(nextFollowing);
      setIsRequested(nextRequested);
      if (typeof payload.data.followers_count === "number") {
        setFollowersCount(payload.data.followers_count);
      }

      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate?.(15);
        } catch {
          // Ignore
        }
      }
      
      // Dispatch global event to sync all other buttons of the same author immediately
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("zigo:follow-change", {
            detail: {
              followingId,
              isFollowing: nextFollowing,
              isRequested: nextRequested,
              count: payload.data.followers_count,
            },
          })
        );
      }

      setMessage(
        nextFollowing
          ? "Takip ediliyor."
          : nextRequested
            ? "Takip isteği gönderildi."
            : "Takipten çıkıldı."
      );
      router.refresh();
    } catch {
      setMessage(a.tryAgain);
    } finally {
      setIsSaving(false);
    }
  }

  const isOverlay = variant === "overlay";
  const isCompact = variant === "compact";
  const buttonClass = isOverlay
    ? `tap-scale rounded-lg border px-3 py-1 text-[0.65rem] font-black backdrop-blur transition whitespace-nowrap ${
        isFollowing
          ? "border-white bg-white text-night"
          : isRequested
            ? "border-amber-300 bg-amber-400/30 text-white"
            : "border-white/70 bg-black/10 text-white"
      }`
    : isCompact
      ? `tap-scale w-full h-9 rounded-xl border px-3 text-xs font-black transition whitespace-nowrap flex items-center justify-center ${
          isFollowing
            ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            : isRequested
              ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
              : "border-crystal bg-crystal text-white shadow-xs hover:brightness-105"
        }`
    : `tap-scale w-full h-9 rounded-xl px-3 text-xs font-black transition whitespace-nowrap flex items-center justify-center ${
        isFollowing
          ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          : isRequested
            ? "border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
            : "bg-crystal text-white shadow-xs hover:brightness-105"
      }`;

  const buttonText = isSaving
    ? m.common.saving
    : isFollowing
      ? m.forms.following
      : isRequested
        ? "İstek Gönderildi"
        : m.forms.follow;

  return (
    <div className="w-full min-w-0">
      <button
        className={buttonClass}
        aria-pressed={isFollowing || isRequested}
        data-testid="follow-button"
        disabled={isSaving}
        onClick={toggleFollow}
        type="button"
      >
        {buttonText}
      </button>
      {showCount && typeof followersCount === "number" ? (
        <p className={`${isOverlay ? "text-white/75" : "text-slate-500"} mt-1 text-center text-[0.65rem] font-black`}>
          {new Intl.NumberFormat("en-US", { notation: "compact" }).format(followersCount)} {m.common.followers}
        </p>
      ) : null}
      {message && !isOverlay && !isCompact ? <p className="mt-1 text-xs font-bold text-slate-500">{message}</p> : null}
    </div>
  );
}
