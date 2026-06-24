"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useMessages } from "@/lib/i18n/locale-context";

type PostOptionsButtonProps = {
  canReport?: boolean;
  initialSaved?: boolean;
  postId?: string;
  postKey?: string;
};

export function PostOptionsButton({
  canReport = true,
  initialSaved = false,
  postId,
  postKey,
}: PostOptionsButtonProps) {
  const { actions: a } = useMessages();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isMuted, setIsMuted] = useState(false);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function complete(action: string) {
    setMessage(action);
    setIsOpen(false);
  }

  async function saveToCollection() {
    if (isSaving) return;

    if (!postId) {
      setIsSaved(true);
      complete(a.previewSaved);
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/social/saves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        complete(response.status === 401 ? a.signInToSave : payload?.error ?? a.saveFailed);
        return;
      }

      const payload = (await response.json()) as { data: { is_saved: boolean } };
      setIsSaved(payload.data.is_saved);
      complete(payload.data.is_saved ? a.saved : a.removed);
      router.refresh();
    } catch {
      complete(a.connectionFailed);
    } finally {
      setIsSaving(false);
    }
  }

  function markNotInterested() {
    const key = postKey ?? postId;
    if (key) {
      const hiddenPosts = readHiddenPosts();
      if (!hiddenPosts.includes(key)) {
        window.localStorage.setItem("zigo:not-interested-posts", JSON.stringify([...hiddenPosts, key]));
      }
      window.dispatchEvent(new CustomEvent("zigo:tune-feed", { detail: { postKey: key } }));
    }

    setIsMuted(true);
    complete(a.feedTuned);
  }

  async function reportPost() {
    if (isSaving) return;

    if (!postId) {
      complete(a.previewReport);
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/social/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, reason: "safety_review" }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        complete(response.status === 401 ? a.signInToReport : payload?.error ?? a.reportFailed);
        return;
      }

      complete(a.reportSent);
    } catch {
      complete(a.connectionFailed);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="relative">
      <button
        aria-label={a.postOptions}
        className={`tap-scale flex size-9 items-center justify-center rounded-lg ${isMuted ? "text-slate-300" : "text-night"}`}
        disabled={isSaving}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <svg aria-hidden="true" className="size-5" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="5" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="19" cy="12" r="1.8" />
        </svg>
      </button>
      {message ? (
        <p className="absolute right-0 top-8 z-10 w-40 rounded-lg bg-slate-900 px-3 py-2 text-right text-[0.68rem] font-black text-white">
          {message}
        </p>
      ) : null}
      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/45 px-4 pb-4 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
          <div
            className="mx-auto w-full max-w-md overflow-hidden rounded-t-2xl bg-white"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex justify-center py-3">
              <span className="h-1 w-12 rounded-full bg-slate-200" />
            </div>
            <button
              className="tap-scale w-full border-b border-slate-100 px-5 py-4 text-left text-sm font-black text-night"
              disabled={isSaving}
              onClick={saveToCollection}
              type="button"
            >
              {isSaving ? a.working : isSaved ? a.unsave : a.save}
            </button>
            <button
              className="tap-scale w-full border-b border-slate-100 px-5 py-4 text-left text-sm font-black text-night"
              onClick={markNotInterested}
              type="button"
            >
              {isMuted ? a.notInterestedAdded : a.notInterested}
            </button>
            {canReport ? (
              <button
                className="tap-scale w-full border-b border-slate-100 px-5 py-4 text-left text-sm font-black text-rose-600"
                disabled={isSaving}
                onClick={reportPost}
                type="button"
              >
                {a.report}
              </button>
            ) : null}
            <button
              className="tap-scale w-full px-5 py-4 text-center text-sm font-black text-slate-500"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              {a.cancel}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function readHiddenPosts() {
  try {
    const raw = window.localStorage.getItem("zigo:not-interested-posts");
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}
