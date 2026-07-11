"use client";

import React from "react";

import { ActionIcon } from "./action-icons";

type LikeAndShareBarProps = {
  isLiked: boolean;
  isUnderstood: boolean;
  isSaved: boolean;
  likes: number;
  comments: number;
  variant: "full" | "compact";
  pendingAction: "likes" | "saves" | null;
  safeQuickReplies: string[];
  numberFormatter: Intl.NumberFormat;
  comment: string;
  isCommentSaving: boolean;
  onToggleLike: () => void;
  onToggleUnderstood: () => void;
  onToggleSave: () => void;
  onLoadComments: () => void;
  onSharePost: () => void;
  onSetComment: (val: string) => void;
  onSubmitComment: () => void;
  labels: {
    like: string;
    unlike: string;
    understood: string;
    comment: string;
    share: string;
    save: string;
    unsave: string;
    likes: string;
    viewComments: string;
    viewAllComments: string;
    addComment: string;
    post: string;
    posting: string;
  };
};

export function LikeAndShareBar({
  isLiked,
  isUnderstood,
  isSaved,
  likes,
  comments,
  variant,
  pendingAction,
  safeQuickReplies,
  numberFormatter,
  comment,
  isCommentSaving,
  onToggleLike,
  onToggleUnderstood,
  onToggleSave,
  onLoadComments,
  onSharePost,
  onSetComment,
  onSubmitComment,
  labels,
}: LikeAndShareBarProps) {
  return (
    <div className={variant === "compact" ? "space-y-1.5" : "space-y-3"}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <button
            aria-label={isLiked ? labels.unlike : labels.like}
            className={`tap-scale flex size-9 items-center justify-center transition ${isLiked ? "text-rose-500" : "text-night"}`}
            disabled={pendingAction === "likes"}
            onClick={onToggleLike}
            type="button"
          >
            <ActionIcon name="like" filled={isLiked} />
          </button>
          <button
            aria-label={labels.understood}
            className={`tap-scale flex h-9 items-center gap-1 rounded-full px-2.5 text-[0.62rem] font-black transition ${
              isUnderstood ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
            }`}
            onClick={onToggleUnderstood}
            type="button"
          >
            <span aria-hidden="true">✓</span>
            {labels.understood}
          </button>
          <button aria-label={labels.comment} className="tap-scale flex size-9 items-center justify-center text-night" onClick={onLoadComments} type="button">
            <ActionIcon name="comment" />
          </button>
          <button aria-label={labels.share} className="tap-scale flex size-9 items-center justify-center text-night" onClick={onSharePost} type="button">
            <ActionIcon name="share" />
          </button>
        </div>
        <button
          aria-label={isSaved ? labels.unsave : labels.save}
          className="tap-scale flex size-9 items-center justify-center text-night transition"
          disabled={pendingAction === "saves"}
          onClick={onToggleSave}
          type="button"
        >
          <ActionIcon name="save" filled={isSaved} />
        </button>
      </div>
      <p className="text-[0.92rem] font-black leading-5 text-night">{numberFormatter.format(likes)} {labels.likes}</p>
      {variant === "full" ? (
        <>
          <button className="text-sm font-bold text-slate-500" onClick={onLoadComments} type="button">
            {comments > 0 ? labels.viewAllComments.replace("{count}", numberFormatter.format(comments)) : labels.viewComments}
          </button>
          <div className="sr-only">
            {safeQuickReplies.map((reply) => (
              <button
                className="tap-scale shrink-0 rounded-lg bg-violet-50 px-3 py-2 text-[0.68rem] font-black text-crystal"
                key={reply}
                onClick={() => onSetComment(reply)}
                type="button"
              >
                {reply}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="min-w-0 flex-1 rounded-lg bg-slate-100 px-4 py-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-slate-200"
              maxLength={1000}
              onChange={(event) => onSetComment(event.target.value)}
              placeholder={labels.addComment}
              value={comment}
            />
            <button
              className="tap-scale zigo-cta tap-scale rounded-lg px-4 py-3 text-xs font-black text-white disabled:opacity-40"
              disabled={!comment.trim() || isCommentSaving}
              onClick={onSubmitComment}
              type="button"
            >
              {isCommentSaving ? labels.posting : labels.post}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
