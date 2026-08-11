"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import {
  type CollectionFolderId,
  rememberPostCollection,
  SaveCollectionSheet,
} from "@/components/save-collection-sheet";
import { useLocale, useMessages } from "@/lib/i18n/locale-context";

import { ActionIcon } from "./social-actions/action-icons";
import { CommentSheet } from "./social-actions/comment-sheet";
import { LikeAndShareBar } from "./social-actions/like-and-share-bar";

export { ActionIcon };

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

    const previousLiked = isLiked;
    const previousLikesCount = likes;
    const previousSaved = isSaved;

    // Optimistic Update
    if (endpoint === "likes") {
      setIsLiked(!isLiked);
      setLikes((current) => Math.max(0, current + (isLiked ? -1 : 1)));
    } else {
      setIsSaved(!isSaved);
    }

    setPendingAction(endpoint);

    try {
      const response = await fetch(`/api/social/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });

      if (!response.ok) {
        // Revert Optimistic Update
        if (endpoint === "likes") {
          setIsLiked(previousLiked);
          setLikes(previousLikesCount);
        } else {
          setIsSaved(previousSaved);
        }

        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setMessage(response.status === 401 ? a.signInToContinue : payload?.error ?? a.actionFailed);
        return;
      }

      if (endpoint === "likes") {
        const payload = (await response.json()) as { data: { is_liked: boolean; likes_count?: number } };
        setIsLiked(payload.data.is_liked);
        if (payload.data.likes_count !== undefined) {
          setLikes(payload.data.likes_count);
        }
      } else {
        const payload = (await response.json()) as { data: { is_saved: boolean; saves_count?: number } };
        setIsSaved(payload.data.is_saved);
        setMessage(payload.data.is_saved ? a.saved : a.removed);
      }

      if (endpoint === "likes") setMessage("");
      router.refresh();
    } catch {
      // Revert Optimistic Update on network error
      if (endpoint === "likes") {
        setIsLiked(previousLiked);
        setLikes(previousLikesCount);
      } else {
        setIsSaved(previousSaved);
      }
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
    <>
      <LikeAndShareBar
        comments={comments}
        comment={comment}
        isCommentSaving={isCommentSaving}
        isLiked={isLiked}
        isSaved={isSaved}
        isUnderstood={isUnderstood}
        labels={{
          addComment: a.addComment,
          comment: a.comment,
          like: a.like,
          likes: a.likes,
          post: a.post,
          posting: a.posting,
          save: a.save,
          share: a.share,
          understood: fe.understood,
          unlike: a.unlike,
          unsave: a.unsave,
          viewAllComments: f.viewAllComments,
          viewComments: a.viewComments,
        }}
        likes={likes}
        numberFormatter={numberFormatter}
        onLoadComments={loadComments}
        onSetComment={setComment}
        onSharePost={sharePost}
        onSubmitComment={submitComment}
        onToggleLike={() => void toggle("likes")}
        onToggleSave={() => (isSaved ? void toggle("saves") : void handleSaveClick())}
        onToggleUnderstood={toggleUnderstood}
        pendingAction={pendingAction}
        safeQuickReplies={safeQuickReplies}
        variant={variant}
      />
      <SaveCollectionSheet
        onClose={() => setIsCollectionSheetOpen(false)}
        onSelect={(folderId) => void saveToCollection(folderId)}
        open={isCollectionSheetOpen}
      />
      {message ? <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">{message}</p> : null}
      <CommentSheet
        comment={comment}
        commentsCount={comments}
        inputRef={commentSheetInputRef}
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
          studentCommentsReview: p.studentCommentsReview,
          verified: a.verified,
          zigoUser: p.zigoUser,
        }}
        loadedComments={loadedComments}
        message={message}
        numberFormatter={numberFormatter}
        onClose={() => setIsCommentSheetOpen(false)}
        onSetComment={setComment}
        onSetReplyingTo={setReplyingTo}
        onSubmitComment={submitComment}
        replyingTo={replyingTo}
        safeQuickReplies={safeQuickReplies}
        titleId={commentSheetTitleId}
      />
    </>
  );
}
