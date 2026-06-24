"use client";

import { useEffect, useRef, useState } from "react";

import { useMessages } from "@/lib/i18n/locale-context";

type ReelLearningPointsProps = {
  reelId: string;
  requiresPlayback?: boolean;
};

const storageKey = "zigo:watched-reels";
const requiredWatchSeconds = 60;

export function ReelLearningPoints({ reelId, requiresPlayback = false }: ReelLearningPointsProps) {
  const { actions: a } = useMessages();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isClaimed, setIsClaimed] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isPlaybackActive, setIsPlaybackActive] = useState(!requiresPlayback);
  const [isVisible, setIsVisible] = useState(false);
  const [secondsWatched, setSecondsWatched] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setIsClaimed(readWatchedReels().includes(reelId));
    setIsPlaybackActive(!requiresPlayback);
  }, [reelId, requiresPlayback]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(Boolean(entry?.isIntersecting)),
      { threshold: 0.75 },
    );
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function handlePlayback(event: Event) {
      const detail = (event as CustomEvent<{ isPlaying?: boolean; reelId?: string }>).detail;
      if (detail?.reelId !== reelId) return;
      setIsPlaybackActive(Boolean(detail.isPlaying));
    }

    function handleVisibilityChange() {
      if (document.hidden && requiresPlayback) setIsPlaybackActive(false);
    }

    window.addEventListener("zigo:reel-playback", handlePlayback);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("zigo:reel-playback", handlePlayback);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [reelId, requiresPlayback]);

  useEffect(() => {
    if (!isVisible || !isPlaybackActive || isClaimed || secondsWatched >= requiredWatchSeconds) return;

    const timer = window.setInterval(() => {
      setSecondsWatched((current) => Math.min(requiredWatchSeconds, current + 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isClaimed, isPlaybackActive, isVisible, secondsWatched]);

  async function claimPoints() {
    if (isClaimed || isPending) {
      setMessage(a.pointsAlreadyClaimed);
      return;
    }

    if (secondsWatched < requiredWatchSeconds) {
      setMessage(a.watchMore.replace("{seconds}", String(requiredWatchSeconds - secondsWatched)));
      return;
    }

    setIsPending(true);

    if (isUuid(reelId)) {
      try {
        const response = await fetch("/api/learning/reels/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId: reelId, secondsWatched }),
        });

        const payload = (await response.json().catch(() => null)) as {
          data?: {
            already_awarded: boolean;
            points_awarded: number;
            total_points: number;
          };
          error?: string;
        } | null;

        if (response.ok && payload?.data) {
          persistWatchedReel(reelId);
          setIsClaimed(true);
          setIsPending(false);
          setMessage(
            payload.data.already_awarded
              ? a.alreadyClaimedTotal.replace("{total}", String(payload.data.total_points))
              : a.pointsClaimedTotal
                  .replace("{points}", String(payload.data.points_awarded))
                  .replace("{total}", String(payload.data.total_points)),
          );
          return;
        }

        setIsPending(false);
        setMessage(response.status === 401 ? a.signInToClaim : payload?.error ?? a.actionFailed);
        return;
      } catch {
        setIsPending(false);
        setMessage(a.connectionFailedTryAgain);
        return;
      }
    }

    persistWatchedReel(reelId);
    setIsPending(false);
    setIsClaimed(true);
    setMessage(a.pointsClaimedLocal);
  }

  function persistWatchedReel(id: string) {
    const watchedReels = readWatchedReels();
    const next = watchedReels.includes(id) ? watchedReels : [...watchedReels, id];
    window.localStorage.setItem(storageKey, JSON.stringify(next));
  }

  const remainingSeconds = Math.max(0, requiredWatchSeconds - secondsWatched);
  const canClaim = isClaimed || secondsWatched >= requiredWatchSeconds;

  return (
    <div className="space-y-2" ref={containerRef}>
      <button
        className={`rounded-lg px-3 py-1.5 text-[0.68rem] font-black backdrop-blur ${
          isClaimed ? "bg-mint text-night" : canClaim ? "bg-white text-crystal" : "bg-black/30 text-white"
        }`}
        disabled={isPending || !canClaim}
        onClick={claimPoints}
        type="button"
      >
        {isPending
          ? a.claiming
          : isClaimed
            ? a.watchedPlus10
            : canClaim
              ? a.claimPlus10
              : a.watchSeconds.replace("{seconds}", String(remainingSeconds))}
      </button>
      {!isClaimed ? (
        <div className="h-1.5 overflow-hidden rounded-lg bg-white/20">
          <span
            className="block h-full rounded-lg bg-white transition-all"
            style={{ width: `${(secondsWatched / requiredWatchSeconds) * 100}%` }}
          />
        </div>
      ) : null}
      {requiresPlayback && !isPlaybackActive && !isClaimed ? (
        <p className="text-xs font-bold text-white/70">{a.playReelForPoints}</p>
      ) : null}
      {message ? <p className="text-xs font-bold text-white/80">{message}</p> : null}
    </div>
  );
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function readWatchedReels() {
  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}
