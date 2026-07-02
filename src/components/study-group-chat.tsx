"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { StudyGroupMessageRow } from "@/lib/domain/study-groups";
import { useMessages } from "@/lib/i18n/locale-context";

type StudyGroupChatProps = {
  groupId: string;
  groupName: string;
  initialMessages: StudyGroupMessageRow[];
};

export function StudyGroupChat({ groupId, groupName, initialMessages }: StudyGroupChatProps) {
  const g = useMessages().studyGroups;
  const router = useRouter();
  const [content, setContent] = useState("");
  const [messages, setMessages] = useState(initialMessages);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  async function sendMessage() {
    const trimmed = content.trim();
    if (!trimmed) return;

    setStatus("loading");
    setError("");

    try {
      const response = await fetch(`/api/groups/${groupId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });
      const payload = (await response.json()) as {
        error?: string;
        data?: StudyGroupMessageRow;
      };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? g.messageFailed);
      }

      setMessages((current) => [...current, payload.data!]);
      setContent("");
      router.refresh();
    } catch (sendError) {
      setStatus("error");
      setError(sendError instanceof Error ? sendError.message : g.messageFailed);
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div className="space-y-4 pb-24">
      <section className="-mx-4 border-b border-slate-100 bg-white px-4 pb-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-crystal">{g.chatEyebrow}</p>
        <h1 className="mt-1 text-2xl font-black text-night">{groupName}</h1>
      </section>

      <section className="-mx-4 space-y-2 bg-white px-4 py-4">
        {messages.length === 0 ? (
          <p className="text-sm font-bold text-slate-500">{g.noMessages}</p>
        ) : (
          messages.map((message) => (
            <article className="rounded-lg bg-slate-50 px-3 py-2" key={message.id}>
              <p className="text-xs font-black text-crystal">
                {message.sender?.full_name ?? g.memberFallback}
              </p>
              <p className="mt-1 text-sm leading-6 text-night">{message.content}</p>
            </article>
          ))
        )}
      </section>

      <div className="fixed bottom-20 left-0 right-0 mx-auto max-w-md px-4">
        <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
          <textarea
            className="w-full resize-none rounded-lg px-2 py-2 text-sm font-semibold outline-none"
            onChange={(event) => setContent(event.target.value)}
            placeholder={g.messagePlaceholder}
            rows={2}
            value={content}
          />
          {error ? <p className="px-2 text-xs font-bold text-rose-600">{error}</p> : null}
          <button
            className="tap-scale mt-2 w-full rounded-lg bg-gradient-to-r from-crystal to-berry px-4 py-2.5 text-sm font-black text-white disabled:opacity-60"
            disabled={status === "loading" || !content.trim()}
            onClick={() => void sendMessage()}
            type="button"
          >
            {status === "loading" ? g.saving : g.sendMessage}
          </button>
        </div>
      </div>
    </div>
  );
}
