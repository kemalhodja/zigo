"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useId, useRef, useState } from "react";

import { CommentSheet } from "@/components/social-actions/comment-sheet";
import { triggerHaptic } from "@/lib/client/haptics";
import { useMessages } from "@/lib/i18n/locale-context";

type LoadedComment = {
  id: string;
  content: string;
  moderation_status: string;
  author: { full_name: string | null; is_verified: boolean | null } | null;
};

type ReelActionRailProps = {
  comments: number;
  creator: string;
  initialLiked?: boolean;
  initialLikesCount?: number;
  initialSaved?: boolean;
  likes: string;
  postId?: string;
};

const compactFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  notation: "compact",
});

export function ReelActionRail({
  comments,
  creator,
  initialLiked = false,
  initialLikesCount,
  initialSaved = false,
  likes,
  postId,
}: ReelActionRailProps) {
  const { actions: a, reelUi: r, zigo: z } = useMessages();
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [message, setMessage] = useState("");
  const [pendingAction, setPendingAction] = useState<"likes" | "saves" | null>(null);
  const [bounceKey, setBounceKey] = useState(0);

  // Comment sheet state
  const [isCommentSheetOpen, setIsCommentSheetOpen] = useState(false);
  const [isCommentLoading, setIsCommentLoading] = useState(false);
  const [isCommentSaving, setIsCommentSaving] = useState(false);
  const [comment, setComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [loadedComments, setLoadedComments] = useState<LoadedComment[]>([]);
  const commentSheetTitleId = useId();
  const commentInputRef = useRef<HTMLInputElement | null>(null);

  const numberFormatter = compactFormatter;

  async function toggle(endpoint: "likes" | "saves") {
    if (pendingAction) return;

    if (!postId) {
      if (endpoint === "likes") {
        setIsLiked((current) => {
          const next = !current;
          setLikesCount((count) => typeof count === "number" ? Math.max(0, count + (next ? 1 : -1)) : count);
          return next;
        });
      }
      if (endpoint === "saves") setIsSaved((current) => !current);
      setMessage(endpoint === "likes" ? a.previewLike : isSaved ? a.removed : a.saved);
      return;
    }

    setPendingAction(endpoint);
    setMessage("");

    try {
      const response = await fetch(`/api/social/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });

      if (!response.ok) {
        setMessage(response.status === 401 ? a.signInFirst : a.actionFailed);
        return;
      }

      if (endpoint === "likes") {
        const payload = (await response.json()) as { data: { is_liked: boolean; likes_count?: number } };
        setIsLiked(payload.data.is_liked);
        setLikesCount((current) => payload.data.likes_count ?? (typeof current === "number" ? Math.max(0, current + (payload.data.is_liked ? 1 : -1)) : current));
        setMessage(payload.data.is_liked ? a.liked : a.likeRemoved);
      } else {
        const payload = (await response.json()) as { data: { is_saved: boolean; saves_count?: number } };
        setIsSaved(payload.data.is_saved);
        setMessage(payload.data.is_saved ? a.saved : a.removed);
      }
      router.refresh();
    } catch {
      setMessage(a.connectionFailed);
    } finally {
      setPendingAction(null);
    }
  }

  function handleLikeClick() {
    setBounceKey((k) => k + 1);
    triggerHaptic("light");
    void toggle("likes");
  }

  async function loadComments() {
    setIsCommentSheetOpen(true);
    setIsCommentLoading(true);
    setMessage("");

    if (!postId) {
      setLoadedComments([
        {
          id: "preview-comment",
          content: a.previewCommentContent,
          moderation_status: "approved",
          author: { full_name: a.zigoPreview, is_verified: true },
        },
      ]);
      setIsCommentLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/social/comments?postId=${postId}`);
      if (!response.ok) { setMessage(a.commentsLoadFailed); return; }
      const payload = (await response.json()) as { data: LoadedComment[] };
      setLoadedComments(payload.data);
    } catch {
      setMessage(a.commentsLoadFailed);
    } finally {
      setIsCommentLoading(false);
    }
  }

  async function submitComment() {
    const trimmed = comment.trim();
    if (!trimmed || isCommentSaving) return;
    setIsCommentSaving(true);

    if (!postId) {
      setLoadedComments((current) => [
        { id: `preview-${Date.now()}`, content: trimmed, moderation_status: "approved", author: { full_name: a.previewUser, is_verified: false } },
        ...current,
      ]);
      setComment("");
      setIsCommentSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/social/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content: trimmed }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setMessage(payload?.error ?? a.commentFailed);
        return;
      }

      setComment("");
      setReplyingTo(null);
      await loadComments();
      router.refresh();
    } catch {
      setMessage(a.connectionFailedTryAgain);
    } finally {
      setIsCommentSaving(false);
    }
  }

  async function share() {
    const shareUrl = postId ? `${window.location.origin}/post/${postId}` : window.location.href;
    triggerHaptic("medium");
    if (navigator.share) {
      const didShare = await navigator.share({ title: z.micro, text: `@${creator} · Zigo`, url: shareUrl }).then(() => true).catch(() => false);
      if (didShare) setMessage(a.shareDevice);
      return;
    }
    try {
      await navigator.clipboard?.writeText(shareUrl);
      setMessage(a.shareCopied);
    } catch {
      setMessage(a.shareFailed);
    }
  }

  const likeLabel = typeof likesCount === "number" ? compactFormatter.format(likesCount) : likes;
  const commentLabel = compactFormatter.format(comments);

  return (
    <>
      <div className="absolute bottom-28 right-3 z-10 space-y-3 text-center text-[0.64rem] font-black text-white">
        {/* Like */}
        <button
          aria-label={isLiked ? r.unlikeMicro : r.likeMicro}
          className={`tap-scale relative block disabled:opacity-60 ${isLiked ? "text-rose-400" : "text-white"}`}
          disabled={pendingAction === "likes"}
          onClick={handleLikeClick}
          type="button"
        >
          {isLiked && bounceKey > 0 ? (
            <span
              key={`burst-${bounceKey}`}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full border-2 border-rose-400"
              style={{ animation: "heart-burst-ring 500ms ease-out forwards" }}
            />
          ) : null}
          <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-black/20">
            <span key={`icon-${bounceKey}`} className={bounceKey > 0 ? "animate-spring" : ""}>
              <svg aria-hidden="true" className="size-7" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
              </svg>
            </span>
          </span>
          <span className="mt-1 block max-w-16 text-center text-[0.7rem] font-black leading-tight break-words">{likeLabel}</span>
        </button>

        {/* Comment — opens inline sheet */}
        <RailButton id={`comment-btn-${postId ?? "preview"}`} ariaLabel={r.openComments} label={commentLabel} onClick={loadComments}>
          <svg aria-hidden="true" className="size-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 11.5a8.5 8.5 0 0 1-9 8.5 9.5 9.5 0 0 1-4-.9L3 20l1.3-4A8.5 8.5 0 1 1 21 11.5z" />
          </svg>
        </RailButton>

        {/* Save */}
        <RailButton active={isSaved} ariaLabel={isSaved ? r.unsaveReel : r.saveReel} disabled={pendingAction === "saves"} label={isSaved ? a.saved : a.save} onClick={() => void toggle("saves")}>
          <svg aria-hidden="true" className="size-7" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M6 3h12v18l-6-4-6 4z" />
          </svg>
        </RailButton>

        {/* Share */}
        <RailButton ariaLabel={r.shareReel} label={a.share} onClick={() => void share()}>
          <svg aria-hidden="true" className="size-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
            <path d="M12 16V4" />
            <path d="m7 9 5-5 5 5" />
          </svg>
        </RailButton>

        <span className="mx-auto flex size-10 items-center justify-center rounded-full border border-white/80 bg-black/20 p-0.5 backdrop-blur">
          <span className="flex size-full items-center justify-center rounded-full bg-white text-[0.62rem] font-black text-night">
            {creator.slice(0, 2).toUpperCase()}
          </span>
        </span>
        {message ? (
          <p className="absolute bottom-full right-0 mb-2 w-28 rounded-lg bg-black/35 px-3 py-2 text-[0.64rem] font-black text-white backdrop-blur">
            {message}
          </p>
        ) : null}
      </div>

      {/* Inline comment sheet for reels */}
      <CommentSheet
        comment={comment}
        commentsCount={comments}
        inputRef={commentInputRef}
        isCommentLoading={isCommentLoading}
        isCommentSaving={isCommentSaving}
        isOpen={isCommentSheetOpen}
        labels={{
          addComment: a.addComment,
          clear: a.clear,
          close: a.close,
          closeComments: a.closeComments,
          commentsNewest: a.commentsNewest,
          commentsTitle: a.commentsTitle,
          noCommentsYet: a.noCommentsYet,
          pendingReview: a.pendingReview,
          post: a.post,
          posting: a.posting,
          quickReplies: a.quickReplies,
          reply: a.reply,
          replySafely: a.replySafely,
          replyingTo: a.replyingTo,
          startConversation: a.startConversation,
          studentCommentsReview: a.commentsTitle,
          verified: a.verified,
          zigoUser: a.zigoPreview,
        }}
        loadedComments={loadedComments}
        message={message}
        numberFormatter={numberFormatter}
        onClose={() => setIsCommentSheetOpen(false)}
        onSetComment={setComment}
        onSetReplyingTo={setReplyingTo}
        onSubmitComment={() => void submitComment()}
        replyingTo={replyingTo}
        safeQuickReplies={[a.quickQuestion, a.quickExplainMore]}
        titleId={commentSheetTitleId}
      />
    </>
  );
}

function RailButton({
  active = false,
  ariaLabel,
  children,
  label,
  onClick,
  disabled = false,
  id,
}: {
  active?: boolean;
  ariaLabel: string;
  children: ReactNode;
  disabled?: boolean;
  label: string;
  id?: string;
  onClick?: () => void;
}) {
  return (
    <button id={id} aria-label={ariaLabel} className={`tap-scale block disabled:opacity-60 ${active ? "text-rose-400" : "text-white"}`} disabled={disabled} onClick={onClick} type="button">
      <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-black/20">
        {children}
      </span>
      <span className="mt-1 block max-w-16 text-center text-[0.7rem] font-black leading-tight break-words">{label}</span>
    </button>
  );
}
