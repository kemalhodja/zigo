"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useMessages } from "@/lib/i18n/locale-context";

type FollowButtonProps = {
  followingId?: string;
  sourcePostId?: string;
  initialFollowing?: boolean;
  initialFollowersCount?: number;
  showCount?: boolean;
  variant?: "compact" | "default" | "overlay";
};

export function FollowButton({
  followingId,
  sourcePostId,
  initialFollowersCount,
  initialFollowing = false,
  showCount = false,
  variant = "default",
}: FollowButtonProps) {
  const m = useMessages();
  const a = m.actions;
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [followersCount, setFollowersCount] = useState(initialFollowersCount);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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
      const payloadObj: any = { followingId };
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
        data: { followers_count?: number; following_count?: number; is_following: boolean };
      };
      setIsFollowing(payload.data.is_following);
      if (typeof payload.data.followers_count === "number") {
        setFollowersCount(payload.data.followers_count);
      }
      setMessage(payload.data.is_following ? "Following this creator." : "Unfollowed.");
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
        isFollowing ? "border-white bg-white text-night" : "border-white/70 bg-black/10 text-white"
      }`
    : isCompact
      ? `tap-scale w-full h-9 rounded-xl border px-3 text-xs font-black transition whitespace-nowrap flex items-center justify-center ${
          isFollowing ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50" : "border-crystal bg-crystal text-white shadow-xs hover:brightness-105"
        }`
    : `tap-scale w-full h-9 rounded-xl px-3 text-xs font-black transition whitespace-nowrap flex items-center justify-center ${
        isFollowing ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50" : "bg-crystal text-white shadow-xs hover:brightness-105"
      }`;

  return (
    <div className="w-full min-w-0">
      <button
        className={buttonClass}
        aria-pressed={isFollowing}
        data-testid="follow-button"
        disabled={isSaving}
        onClick={toggleFollow}
        type="button"
      >
        {isSaving ? m.common.saving : isFollowing ? m.forms.following : m.forms.follow}
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
