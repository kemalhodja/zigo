"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { getMediaPlaybackUrl } from "@/lib/domain/video-delivery";
import { useMessages } from "@/lib/i18n/locale-context";

type LearnVideoCardProps = {
  post: {
    id: string;
    title: string | null;
    content: string | null;
    media_url: string | null;
    area_id: number | null;
  };
  childProfileId?: string;
};

export function LearnVideoCard({ post, childProfileId }: LearnVideoCardProps) {
  const { learnUi: l, actions: a } = useMessages();
  const router = useRouter();
  const [message, setMessage] = useState(l.watch60Earn);
  const [isSaving, setIsSaving] = useState(false);
  const playbackUrl = post.media_url ? getMediaPlaybackUrl(post.media_url) : null;

  async function completeVideo() {
    if (isSaving) return;

    setIsSaving(true);
    setMessage(l.saving);

    try {
      const response = await fetch("/api/learn/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
          secondsWatched: 60,
          childProfileId,
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        data?: { points_awarded: number };
        error?: string;
      } | null;

      if (!response.ok || !payload?.data) {
        setMessage(payload?.error ?? l.videoCompleteFailed);
        return;
      }

      setMessage(l.videoCompleted.replace("{points}", String(payload.data.points_awarded)));
      router.refresh();
    } catch {
      setMessage(a.connectionFailedTryAgain);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <article className="mx-0 space-y-5 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6 transition-all hover:shadow-md">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-[0.65rem] font-black uppercase tracking-wider text-violet-600">
          ▶ {l.matchedVideo}
        </span>
        <h3 className="mt-4 text-xl font-black leading-tight text-slate-900">{post.title ?? l.matchedVideo}</h3>
        <p className="mt-2.5 text-sm leading-relaxed text-slate-600">{post.content}</p>
      </div>

      {playbackUrl ? (
        <div className="overflow-hidden rounded-2xl bg-slate-950 shadow-inner ring-1 ring-slate-900/5">
          <video
            className="aspect-video w-full object-cover cursor-pointer"
            controls
            playsInline
            preload="metadata"
            src={playbackUrl}
            onClick={(e) => {
              const video = e.currentTarget;
              if (video.paused) {
                video.play().catch(() => {});
              } else {
                video.pause();
              }
            }}
          />
        </div>
      ) : null}

      <button
        className="w-full zigo-cta tap-scale rounded-lg px-4 py-3 text-sm font-black text-white disabled:opacity-60"
        disabled={isSaving}
        onClick={completeVideo}
        type="button"
      >
        {isSaving ? l.saving : l.markComplete}
      </button>

      <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600">
        {message}
      </p>
    </article>
  );
}
