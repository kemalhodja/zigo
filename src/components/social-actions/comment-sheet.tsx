"use client";

import React, { useEffect } from "react";

type LoadedComment = {
  id: string;
  content: string;
  moderation_status: string;
  author: { full_name: string | null; is_verified: boolean | null } | null;
};

type CommentSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  titleId: string;
  commentsCount: number;
  numberFormatter: Intl.NumberFormat;
  safeQuickReplies: string[];
  isCommentLoading: boolean;
  loadedComments: LoadedComment[];
  comment: string;
  onSetComment: (val: string) => void;
  replyingTo: string | null;
  onSetReplyingTo: (val: string | null) => void;
  onSubmitComment: () => void;
  isCommentSaving: boolean;
  message: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  labels: {
    commentsTitle: string;
    commentsNewest: string;
    studentCommentsReview: string;
    close: string;
    closeComments: string;
    quickReplies: string;
    noCommentsYet: string;
    startConversation: string;
    verified: string;
    pendingReview: string;
    reply: string;
    replySafely: string;
    replyingTo: string;
    clear: string;
    addComment: string;
    posting: string;
    post: string;
    zigoUser: string;
  };
};

export function CommentSheet({
  isOpen,
  onClose,
  titleId,
  commentsCount,
  numberFormatter,
  safeQuickReplies,
  isCommentLoading,
  loadedComments,
  comment,
  onSetComment,
  replyingTo,
  onSetReplyingTo,
  onSubmitComment,
  isCommentSaving,
  message,
  inputRef,
  labels,
}: CommentSheetProps) {
  const commentSheetInputRef = inputRef;
  const [likedCommentIds, setLikedCommentIds] = React.useState<Record<string, boolean>>({});
  const [commentLikesCount, setCommentLikesCount] = React.useState<Record<string, number>>({});

  function toggleCommentLike(commentId: string) {
    setLikedCommentIds((prev) => {
      const isCurrentlyLiked = Boolean(prev[commentId]);
      const nextLiked = !isCurrentlyLiked;
      setCommentLikesCount((counts) => ({
        ...counts,
        [commentId]: (counts[commentId] ?? 0) + (nextLiked ? 1 : -1),
      }));
      return { ...prev, [commentId]: nextLiked };
    });
  }

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => commentSheetInputRef.current?.focus(), 0);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, commentSheetInputRef]);

  if (!isOpen) return null;

  return (
    <section
      className="fixed inset-0 z-50 flex items-end bg-black/50 px-0 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="safe-bottom mx-auto flex max-h-[84dvh] w-full max-w-md flex-col rounded-t-2xl bg-white p-4"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-slate-200" />
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-night" id={titleId}>{labels.commentsTitle}</h3>
            <p className="mt-1 text-xs font-bold text-slate-500">
              {labels.commentsNewest.replace("{count}", numberFormatter.format(commentsCount))}
            </p>
            <p className="sr-only">{labels.studentCommentsReview}</p>
          </div>
          <button
            aria-label={labels.closeComments}
            className="tap-scale rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-slate-500"
            onClick={onClose}
            type="button"
          >
            {labels.close}
          </button>
        </div>
        <details className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-xs">
          <summary className="cursor-pointer font-black text-slate-500">{labels.quickReplies}</summary>
          <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
            {safeQuickReplies.map((reply) => (
              <button
                className="tap-scale shrink-0 rounded-lg bg-white px-3 py-2 text-[0.68rem] font-black text-slate-600"
                key={reply}
                onClick={() => onSetComment(reply)}
                type="button"
              >
                {reply}
              </button>
            ))}
          </div>
        </details>
        <div className="min-h-0 flex-1 overflow-y-auto pb-3">
          {isCommentLoading ? (
            <div className="space-y-4 py-3">
              {[0, 1, 2].map((item) => (
                <div className="flex gap-3" key={item}>
                  <span className="skeleton-shimmer size-9 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="skeleton-shimmer h-3 w-28 rounded-lg" />
                    <div className="skeleton-shimmer h-3 w-full rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : loadedComments.length === 0 ? (
            <div className="rounded-lg bg-slate-50 px-4 py-8 text-center">
              <p className="text-sm font-black text-night">{labels.noCommentsYet}</p>
              <p className="mx-auto mt-1 max-w-56 text-sm font-bold leading-6 text-slate-500">
                {labels.startConversation}
              </p>
            </div>
          ) : (
            loadedComments.map((item) => (
              <article className="flex gap-3 border-b border-slate-100 py-3" key={item.id}>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[0.68rem] font-black text-night">
                  {(item.author?.full_name ?? "ZU").slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-black text-night">
                      {item.author?.full_name ?? labels.zigoUser}
                    </p>
                    {item.author?.is_verified ? (
                      <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[0.6rem] font-black text-night">
                        {labels.verified}
                      </span>
                    ) : null}
                    {item.moderation_status !== "approved" ? (
                      <span className="rounded-lg bg-amber-100 px-2 py-0.5 text-[0.6rem] font-black text-amber-700">
                        {labels.pendingReview}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm leading-5 text-slate-600">{item.content}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <button
                      aria-label={labels.replySafely}
                      className="text-xs font-black text-crystal"
                      onClick={() => {
                        const name = item.author?.full_name ?? labels.zigoUser;
                        onSetReplyingTo(name);
                        onSetComment(`@${name.split(" ")[0]} `);
                      }}
                      type="button"
                    >
                      {labels.reply} <span className="sr-only">safely</span>
                    </button>
                    <button
                      aria-label="Yorumu beğen"
                      className={`tap-scale flex items-center gap-1 text-xs font-bold transition ${
                        likedCommentIds[item.id] ? "text-rose-500" : "text-slate-400 hover:text-slate-600"
                      }`}
                      onClick={() => toggleCommentLike(item.id)}
                      type="button"
                    >
                      <svg
                        aria-hidden="true"
                        className={`size-3.5 ${likedCommentIds[item.id] ? "fill-rose-500" : "fill-none"}`}
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                      {commentLikesCount[item.id] && commentLikesCount[item.id] > 0 ? (
                        <span>{commentLikesCount[item.id]}</span>
                      ) : null}
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
        {message ? (
          <p className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
            {message}
          </p>
        ) : null}
        {replyingTo ? (
          <div className="mb-2 flex items-center justify-between rounded-lg bg-violet-50 px-3 py-2 text-xs font-bold text-crystal">
            <span>{labels.replyingTo.replace("{name}", replyingTo)}</span>
            <button className="font-black" onClick={() => { onSetReplyingTo(null); onSetComment(""); }} type="button">
              {labels.clear}
            </button>
          </div>
        ) : null}
        <div className="flex gap-2 border-t border-slate-100 pt-3">
          <input
            ref={commentSheetInputRef}
            className="min-w-0 flex-1 rounded-lg bg-slate-100 px-4 py-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-slate-200"
            maxLength={1000}
            onChange={(event) => onSetComment(event.target.value)}
            placeholder={labels.addComment}
            value={comment}
          />
          <button
            className="tap-scale zigo-cta tap-scale rounded-lg px-5 py-3 text-xs font-black text-white disabled:opacity-40"
            disabled={!comment.trim() || isCommentSaving}
            onClick={onSubmitComment}
            type="button"
          >
            {isCommentSaving ? labels.posting : labels.post}
          </button>
        </div>
      </div>
    </section>
  );
}
