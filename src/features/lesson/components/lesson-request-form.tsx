"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useCreateLessonRequest } from "@/features/lesson/hooks/use-create-lesson-request";
import { useMessages } from "@/lib/i18n/locale-context";

type ChildOption = { id: string; name: string };

type LessonRequestFormProps = {
  childrenOptions?: ChildOption[];
  fixedReceiver?: { id: string; name: string };
  redirectOnSuccess?: string;
  onSuccess?: () => void;
  compact?: boolean;
};

export function LessonRequestForm({
  childrenOptions = [],
  fixedReceiver,
  redirectOnSuccess = "/parent/requests?sent=1",
  onSuccess,
  compact = false,
}: LessonRequestFormProps) {
  const lr = useMessages().lessonRequests;
  const router = useRouter();
  const createRequest = useCreateLessonRequest();
  const [selectedChildId, setSelectedChildId] = useState("");
  const [requestBody, setRequestBody] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    if (!fixedReceiver) return;

    try {
      await createRequest.mutateAsync({
        receiverId: fixedReceiver.id,
        childProfileId: selectedChildId || undefined,
        messageBody: requestBody,
        priority: isUrgent ? "urgent" : "normal",
      });
      setSubmitted(true);
      onSuccess?.();
      window.dispatchEvent(new Event("zigo:lesson-request-changed"));
      if (redirectOnSuccess) {
        router.push(redirectOnSuccess);
      }
    } catch {
      // mutation error surfaced below
    }
  }

  if (submitted && !redirectOnSuccess) {
    return (
      <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-cyan-50 px-4 py-6 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500 text-2xl text-white">
          ✓
        </span>
        <h3 className="mt-4 text-lg font-black text-night">{lr.successTitle}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{lr.successDesc}</p>
        <Link
          className="tap-scale zigo-cta mt-4 inline-flex rounded-xl px-4 py-3 text-sm font-black text-white"
          href="/parent/requests"
        >
          {lr.myRequestsCta}
        </Link>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${compact ? "" : "rounded-2xl border border-cyan-100 bg-cyan-50/40 p-4"}`}>
      {fixedReceiver ? (
        <div className="rounded-xl border border-white/80 bg-white/70 px-3 py-2">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{lr.requestToTeacher}</p>
          <p className="mt-1 text-sm font-black text-night">{fixedReceiver.name}</p>
        </div>
      ) : null}

      {childrenOptions.length > 0 ? (
        <label className="block">
          <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{lr.chooseChild}</span>
          <select
            className="zigo-input mt-1 w-full rounded-xl px-3 py-2 text-sm font-semibold"
            onChange={(event) => setSelectedChildId(event.target.value)}
            value={selectedChildId}
          >
            <option value="">{lr.chooseChild}</option>
            {childrenOptions.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="block">
        <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{lr.messageLabel}</span>
        <textarea
          className="zigo-input mt-1 min-h-24 w-full rounded-xl px-3 py-2 text-sm font-semibold"
          onChange={(event) => setRequestBody(event.target.value)}
          placeholder={lr.messagePlaceholder}
          value={requestBody}
        />
      </label>

      <label className="flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50/60 px-3 py-2">
        <input
          checked={isUrgent}
          className="size-4 rounded border-rose-300"
          onChange={(event) => setIsUrgent(event.target.checked)}
          type="checkbox"
        />
        <span className="text-sm font-black text-rose-700">{lr.urgentLabel}</span>
      </label>

      {createRequest.error ? (
        <p className="text-sm font-bold text-rose-600">
          {createRequest.error instanceof Error ? createRequest.error.message : lr.saveFailed}
        </p>
      ) : null}

      <button
        className="tap-scale zigo-cta w-full rounded-xl px-4 py-3 text-sm font-black text-white disabled:opacity-60"
        disabled={!fixedReceiver || requestBody.trim().length < 10 || createRequest.isPending}
        onClick={() => void handleSubmit()}
        type="button"
      >
        {createRequest.isPending ? lr.sending : lr.sendRequest}
      </button>
    </div>
  );
}
