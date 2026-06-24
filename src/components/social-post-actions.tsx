"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import {
  type CollectionFolderId,
  rememberPostCollection,
  SaveCollectionSheet,
} from "@/components/save-collection-sheet";
import { useLocale, useMessages } from "@/lib/i18n/locale-context";

type LoadedComment = {
  id: string;
  content: string;
  moderation_status: string;
  author: { full_name: string | null; is_verified: boolean | null } | null;
};

type SocialPostActionsProps = {
  postId?: string;
  initialLikes: number;
  initialComments: number;
  initialLiked?: boolean;
  initialSaved?: boolean;
  variant?: "full" | "compact";
};

export function SocialPostActions({
  postId,
  initialLikes,
  initialComments,
  initialLiked = false,
  initialSaved = false,
  variant = "full",
}: SocialPostActionsProps) {
  const { actions: a, storyUi: s, postDetail: p, feedExtras: f, feedEnhancements: fe } = useMessages();
  const locale = useLocale();
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale === "en" ? "en-US" : "tr-TR"), [locale]);
  const safeQuickReplies = [s.quickGreat, a.quickQuestion, s.quickSaved, a.quickExplainMore];
  const router = useRouter();
  const [likes, setLikes] = useState(initialLikes);
  const [comments, setComments] = useState(initialComments);
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [comment, setComment] = useState("");
  const [loadedComments, setLoadedComments] = useState<LoadedComment[]>([]);
  const [isCommentSheetOpen, setIsCommentSheetOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [pendingAction, setPendingAction] = useState<"likes" | "saves" | null>(null);
  const [isCommentLoading, setIsCommentLoading] = useState(false);
  const [isCommentSaving, setIsCommentSaving] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isCollectionSheetOpen, setIsCollectionSheetOpen] = useState(false);
  const [isUnderstood, setIsUnderstood] = useState(false);
  const commentSheetInputRef = useRef<HTMLInputElement>(null);
  const commentSheetTitleId = useId();

  useEffect(() => {
    if (!postId) return;
    try {
      setIsUnderstood(window.localStorage.getItem(`zigo:understood:${postId}`) === "1");
    } catch {
      setIsUnderstood(false);
    }
  }, [postId]);

  function toggleUnderstood() {
    if (!postId) {
      setIsUnderstood((current) => !current);
      return;
    }

    const next = !isUnderstood;
    setIsUnderstood(next);
    try {
      if (next) window.localStorage.setItem(`zigo:understood:${postId}`, "1");
      else window.localStorage.removeItem(`zigo:understood:${postId}`);
    } catch {
      // ignore
    }
  }

  async function handleSaveClick() {
    if (isSaved) {
      await toggle("saves");
      return;
    }

    if (!postId) {
      setIsSaved(true);
      setIsCollectionSheetOpen(true);
      return;
    }

    setIsCollectionSheetOpen(true);
  }

  async function saveToCollection(folderId: CollectionFolderId) {
    const folderLabels: Record<CollectionFolderId, string> = {
      lessons: fe.collectionLessons,
      reels: fe.collectionReels,
      teachers: fe.collectionTeachers,
      exam: fe.collectionExam,
    };

    setIsCollectionSheetOpen(false);

    if (!postId) {
      setIsSaved(true);
      setMessage(fe.collectionSaved.replace("{name}", folderLabels[folderId]));
      return;
    }

    setPendingAction("saves");
    try {
      const response = await fetch("/api/social/saves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setMessage(response.status === 401 ? a.signInToContinue : payload?.error ?? a.actionFailed);
        return;
      }

      const payload = (await response.json()) as { data: { is_saved: boolean } };
      setIsSaved(payload.data.is_saved);
      rememberPostCollection(postId, folderId);
      setMessage(fe.collectionSaved.replace("{name}", folderLabels[folderId]));
      router.refresh();
    } catch {
      setMessage(a.connectionFailedTryAgain);
    } finally {
      setPendingAction(null);
    }
  }

  useEffect(() => {
    if (!isCommentSheetOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => commentSheetInputRef.current?.focus(), 0);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsCommentSheetOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCommentSheetOpen]);

  async function toggle(endpoint: "likes" | "saves") {
    if (pendingAction) return;

    if (!postId) {
      if (endpoint === "likes") {
        setIsLiked((current) => !current);
        setLikes((current) => Math.max(0, current + (isLiked ? -1 : 1)));
      } else {
        setIsSaved((current) => !current);
      }
      setMessage(endpoint === "likes" ? "" : isSaved ? "Removed." : "Saved.");
      return;
    }

    setPendingAction(endpoint);

    try {
      const response = await fetch(`/api/social/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setMessage(response.status === 401 ? a.signInToContinue : payload?.error ?? a.actionFailed);
        return;
      }

      if (endpoint === "likes") {
        const payload = (await response.json()) as { data: { is_liked: boolean; likes_count?: number } };
        setIsLiked(payload.data.is_liked);
        setLikes((current) => payload.data.likes_count ?? Math.max(0, current + (payload.data.is_liked ? 1 : -1)));
      } else {
        const payload = (await response.json()) as { data: { is_saved: boolean; saves_count?: number } };
        setIsSaved(payload.data.is_saved);
        setMessage(payload.data.is_saved ? a.saved : a.removed);
      }

      if (endpoint === "likes") setMessage("");
      router.refresh();
    } catch {
      setMessage(a.connectionFailedTryAgain);
    } finally {
      setPendingAction(null);
    }
  }

  async function submitComment() {
    const trimmed = comment.trim();
    if (!trimmed || isCommentSaving) return;

    setIsCommentSaving(true);

    if (!postId) {
      setComments((current) => current + 1);
      setLoadedComments((current) => [
        {
          id: `preview-${Date.now()}`,
          content: trimmed,
          moderation_status: "approved",
          author: { full_name: a.previewUser, is_verified: false },
        },
        ...current,
      ]);
      setComment("");
      setMessage("");
      setIsCommentSaving(false);
      setIsCommentSheetOpen(true);
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

      const payload = (await response.json()) as { data?: { comments_count?: number; moderation_status?: string } };
      setComments((current) => payload.data?.comments_count ?? current + 1);
      setComment("");
      setReplyingTo(null);
      const successMessage =
        payload.data?.moderation_status === "pending"
          ? a.commentPending
          : a.commentPosted;
      await loadComments();
      setMessage(successMessage);
      router.refresh();
    } catch {
      setMessage(a.connectionFailedTryAgain);
    } finally {
      setIsCommentSaving(false);
    }
  }

  async function loadComments() {
    setIsCommentSheetOpen(true);
    setIsCommentLoading(true);
    setMessage("");

    if (!postId) {
      setLoadedComments((current) =>
        current.length > 0
          ? current
          : [
              {
                id: "preview-comment",
                content: a.previewCommentContent,
                moderation_status: "approved",
                author: { full_name: a.zigoPreview, is_verified: true },
              },
            ],
      );
      setIsCommentLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/social/comments?postId=${postId}`);
      if (!response.ok) {
        setMessage(a.commentsLoadFailed);
        return;
      }

      const payload = (await response.json()) as { data: LoadedComment[] };
      setLoadedComments(payload.data);
    } catch {
      setMessage(a.commentsLoadFailed);
    } finally {
      setIsCommentLoading(false);
    }
  }

  async function sharePost() {
    const shareUrl = postId ? `${window.location.origin}/post/${postId}` : window.location.href;

    try {
      if (navigator.share) {
        const didShare = await navigator.share({
          title: a.shareTitle,
          text: a.shareText,
          url: shareUrl,
        }).then(() => true).catch(() => false);
        if (didShare) setMessage(a.shareDevice);
        return;
      }

      await navigator.clipboard?.writeText(shareUrl);
      setMessage(a.shareCopied);
    } catch {
      setMessage(a.shareFailed);
    }
  }

  return (
    <div className={variant === "compact" ? "space-y-1.5" : "space-y-3"}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <button
            aria-label={isLiked ? a.unlike : a.like}
            className={`tap-scale flex size-9 items-center justify-center transition ${isLiked ? "text-rose-500" : "text-night"}`}
            disabled={pendingAction === "likes"}
            onClick={() => toggle("likes")}
            type="button"
          >
            <ActionIcon name="like" filled={isLiked} />
          </button>
          <button
            aria-label={fe.understood}
            className={`tap-scale flex h-9 items-center gap-1 rounded-full px-2.5 text-[0.62rem] font-black transition ${
              isUnderstood ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
            }`}
            onClick={toggleUnderstood}
            type="button"
          >
            <span aria-hidden="true">✓</span>
            {fe.understood}
          </button>
          <button aria-label={a.comment} className="tap-scale flex size-9 items-center justify-center text-night" onClick={loadComments} type="button">
            <ActionIcon name="comment" />
          </button>
          <button aria-label={a.share} className="tap-scale flex size-9 items-center justify-center text-night" onClick={sharePost} type="button">
            <ActionIcon name="share" />
          </button>
        </div>
        <button
          aria-label={isSaved ? a.unsave : a.save}
          className="tap-scale flex size-9 items-center justify-center text-night transition"
          disabled={pendingAction === "saves"}
          onClick={() => (isSaved ? void toggle("saves") : void handleSaveClick())}
          type="button"
        >
          <ActionIcon name="save" filled={isSaved} />
        </button>
      </div>
      <p className="text-[0.92rem] font-black leading-5 text-night">{numberFormatter.format(likes)} {a.likes}</p>
      <SaveCollectionSheet
        onClose={() => setIsCollectionSheetOpen(false)}
        onSelect={(folderId) => void saveToCollection(folderId)}
        open={isCollectionSheetOpen}
      />
      {variant === "full" ? (
        <>
          <button className="text-sm font-bold text-slate-500" onClick={loadComments} type="button">
            {comments > 0 ? f.viewAllComments.replace("{count}", numberFormatter.format(comments)) : a.viewComments}
          </button>
          <div className="sr-only">
            {safeQuickReplies.map((reply) => (
              <button
                className="tap-scale shrink-0 rounded-lg bg-violet-50 px-3 py-2 text-[0.68rem] font-black text-crystal"
                key={reply}
                onClick={() => setComment(reply)}
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
              onChange={(event) => setComment(event.target.value)}
              placeholder={a.addComment}
              value={comment}
            />
            <button
              className="tap-scale zigo-cta tap-scale rounded-lg px-4 py-3 text-xs font-black text-white disabled:opacity-40"
              disabled={!comment.trim() || isCommentSaving}
              onClick={submitComment}
              type="button"
            >
              {isCommentSaving ? a.posting : a.post}
            </button>
          </div>
        </>
      ) : null}
      {message ? <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">{message}</p> : null}
      {isCommentSheetOpen ? (
        <section
          className="fixed inset-0 z-50 flex items-end bg-black/50 px-0 backdrop-blur-sm"
          onClick={() => setIsCommentSheetOpen(false)}
        >
          <div
            aria-labelledby={commentSheetTitleId}
            aria-modal="true"
            className="safe-bottom mx-auto flex max-h-[84dvh] w-full max-w-md flex-col rounded-t-2xl bg-white p-4"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-slate-200" />
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-night" id={commentSheetTitleId}>{a.commentsTitle}</h3>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  {a.commentsNewest.replace("{count}", numberFormatter.format(comments))}
                </p>
                <p className="sr-only">{p.studentCommentsReview}</p>
              </div>
              <button
                aria-label={a.closeComments}
                className="tap-scale rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-slate-500"
                onClick={() => setIsCommentSheetOpen(false)}
                type="button"
              >
                {a.close}
              </button>
            </div>
            <details className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-xs">
              <summary className="cursor-pointer font-black text-slate-500">{a.quickReplies}</summary>
              <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
              {safeQuickReplies.map((reply) => (
                <button
                  className="tap-scale shrink-0 rounded-lg bg-white px-3 py-2 text-[0.68rem] font-black text-slate-600"
                  key={reply}
                  onClick={() => setComment(reply)}
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
                  <p className="text-sm font-black text-night">{a.noCommentsYet}</p>
                  <p className="mx-auto mt-1 max-w-56 text-sm font-bold leading-6 text-slate-500">
                    {a.startConversation}
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
                          {item.author?.full_name ?? p.zigoUser}
                        </p>
                        {item.author?.is_verified ? (
                          <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[0.6rem] font-black text-night">
                            {a.verified}
                          </span>
                        ) : null}
                        {item.moderation_status !== "approved" ? (
                          <span className="rounded-lg bg-amber-100 px-2 py-0.5 text-[0.6rem] font-black text-amber-700">
                            {a.pendingReview}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm leading-5 text-slate-600">{item.content}</p>
                      <button
                        aria-label={a.replySafely}
                        className="mt-2 text-xs font-black text-crystal"
                        onClick={() => {
                          const name = item.author?.full_name ?? p.zigoUser;
                          setReplyingTo(name);
                          setComment(`@${name.split(" ")[0]} `);
                        }}
                        type="button"
                      >
                        {a.reply} <span className="sr-only">safely</span>
                      </button>
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
                <span>{a.replyingTo.replace("{name}", replyingTo)}</span>
                <button className="font-black" onClick={() => { setReplyingTo(null); setComment(""); }} type="button">
                  {a.clear}
                </button>
              </div>
            ) : null}
            <div className="flex gap-2 border-t border-slate-100 pt-3">
              <input
                ref={commentSheetInputRef}
                className="min-w-0 flex-1 rounded-lg bg-slate-100 px-4 py-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-slate-200"
                maxLength={1000}
                onChange={(event) => setComment(event.target.value)}
                placeholder={a.addComment}
                value={comment}
              />
              <button
                className="tap-scale zigo-cta tap-scale rounded-lg px-5 py-3 text-xs font-black text-white disabled:opacity-40"
                disabled={!comment.trim() || isCommentSaving}
                onClick={submitComment}
                type="button"
              >
                {isCommentSaving ? a.posting : a.post}
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ActionIcon({ filled = false, name }: { filled?: boolean; name: string }) {
  if (name === "like") {
    return (
      <svg aria-hidden="true" className="size-6" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
      </svg>
    );
  }

  if (name === "comment") {
    return (
      <svg aria-hidden="true" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M21 11.5a8.5 8.5 0 0 1-9 8.5 9.5 9.5 0 0 1-4-.9L3 20l1.3-4A8.5 8.5 0 1 1 21 11.5z" />
      </svg>
    );
  }

  if (name === "share") {
    return (
      <svg aria-hidden="true" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M22 2L11 13" />
        <path d="M22 2l-7 20-4-9-9-4z" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="size-6" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M6 3h12v18l-6-4-6 4z" />
    </svg>
  );
}
