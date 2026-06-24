"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import { useMessages } from "@/lib/i18n/locale-context";

type StoryReplyFormProps = {
  storyId?: string;
};

export function StoryReplyForm({ storyId }: StoryReplyFormProps) {
  const { actions: a, storyUi: s, sparkViewer: sv } = useMessages();
  const quickReactions = [s.quickGreat, s.quickSaved, s.quickMore];
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);

    if (!storyId || storyId.startsWith("demo-")) {
      setContent("");
      setMessage(a.demoSparkReply);
      setIsSending(false);
      return;
    }

    try {
      const response = await fetch("/api/social/stories/replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId, content: trimmed }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setMessage(response.status === 401 ? a.signInToReply : payload?.error ?? a.replyFailed);
        return;
      }

      const payload = (await response.json()) as { data?: { moderation_status?: string } };
      setContent("");
      setMessage(payload.data?.moderation_status === "pending" ? a.replyPending : a.replySent);
    } catch {
      setMessage(a.tryAgain);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <form className="space-y-2" onSubmit={sendReply}>
      <div className="flex items-center justify-between rounded-lg bg-black/20 px-3 py-2 text-[0.68rem] font-black text-white backdrop-blur">
        <span>Matched Spark</span>
        <span className="rounded-md bg-white px-2 py-0.5 text-night">
          Reply <span className="sr-only">area-gated safety wall moderated</span>
        </span>
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {quickReactions.map((reaction) => (
          <button
            className="tap-scale shrink-0 rounded-lg bg-white/15 px-3 py-2 text-[0.68rem] font-black text-white backdrop-blur"
            key={reaction}
            onClick={() => setContent(reaction)}
            type="button"
          >
            {reaction}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="min-w-0 flex-1 rounded-lg border border-white/25 bg-black/18 px-4 py-3 text-sm font-bold text-white placeholder:text-white/70 outline-none backdrop-blur transition focus:bg-white/20"
          maxLength={1000}
          onChange={(event) => setContent(event.target.value)}
          placeholder={sv.replyPlaceholder}
          value={content}
        />
        <button
          className="tap-scale rounded-lg bg-white px-4 py-3 text-sm font-black text-night disabled:opacity-60"
          disabled={!content.trim() || isSending}
          type="submit"
        >
          {isSending ? "Sending..." : "Send"}
        </button>
      </div>
      {message ? <p className="text-xs font-bold text-white/80">{message}</p> : null}
    </form>
  );
}
