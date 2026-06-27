"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useMessages } from "@/lib/i18n/locale-context";

type ChildOption = { id: string; name: string };
type TeacherOption = {
  id: string;
  full_name: string;
  organization_type: string | null;
  shared_areas: string[];
};

type RequestItem = {
  id: string;
  sender_id: string;
  receiver_id: string;
  child_profile_id: string | null;
  status: "pending" | "accepted" | "rejected" | "closed";
  priority?: "normal" | "urgent";
  message_body: string;
  created_at: string;
  sender: { full_name: string; role: string } | null;
  receiver: { full_name: string; role: string; organization_type?: string | null } | null;
};

type ThreadMessage = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender: { full_name: string } | null;
};

type LessonRequestsPanelProps = {
  role: "parent" | "teacher";
  viewerId: string;
  childrenOptions?: ChildOption[];
  redirectOnCreate?: string;
};

function statusLabel(status: RequestItem["status"], labels: ReturnType<typeof useMessages>["lessonRequests"]) {
  if (status === "pending") return labels.pending;
  if (status === "accepted") return labels.acceptedStatus;
  if (status === "rejected") return labels.rejectedStatus;
  return labels.closedStatus;
}

export function LessonRequestsPanel({
  role,
  viewerId,
  childrenOptions = [],
  redirectOnCreate,
}: LessonRequestsPanelProps) {
  const lr = useMessages().lessonRequests;
  const router = useRouter();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedChildId, setSelectedChildId] = useState("");
  const [requestBody, setRequestBody] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const [threadMessage, setThreadMessage] = useState("");
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const pendingCount = useMemo(
    () => requests.filter((item) => item.status === "pending" && item.receiver_id === viewerId).length,
    [requests, viewerId],
  );

  async function loadRequests() {
    const response = await fetch("/api/lesson-requests");
    const payload = (await response.json()) as { data?: RequestItem[]; error?: string };
    if (!response.ok) throw new Error(payload.error ?? lr.saveFailed);
    setRequests(payload.data ?? []);
  }

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      setLoading(true);
      try {
        await loadRequests();
        if (role === "parent") {
          const teacherResponse = await fetch("/api/lesson-requests/teachers");
          const teacherPayload = (await teacherResponse.json()) as { data?: TeacherOption[] };
          if (!cancelled) setTeachers(teacherPayload.data ?? []);
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : lr.saveFailed);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [lr.saveFailed, role]);

  async function createRequest() {
    setPendingAction("create");
    setMessage("");

    try {
      const response = await fetch("/api/lesson-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: selectedTeacherId,
          childProfileId: selectedChildId || undefined,
          messageBody: requestBody,
          priority: isUrgent ? "urgent" : "normal",
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? lr.saveFailed);

      if (redirectOnCreate) {
        router.push(redirectOnCreate);
        return;
      }

      setMessage(lr.sent);
      setShowComposer(false);
      setRequestBody("");
      setSelectedTeacherId("");
      setSelectedChildId("");
      setIsUrgent(false);
      await loadRequests();
      router.refresh();
      window.dispatchEvent(new Event("zigo:lesson-request-changed"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : lr.saveFailed);
    } finally {
      setPendingAction(null);
    }
  }

  async function updateStatus(requestId: string, status: "accepted" | "rejected" | "closed") {
    setPendingAction(requestId);
    setMessage("");

    try {
      const response = await fetch(`/api/lesson-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? lr.saveFailed);

      setMessage(status === "accepted" ? lr.accepted : status === "rejected" ? lr.rejected : lr.closed);
      await loadRequests();
      router.refresh();
      window.dispatchEvent(new Event("zigo:lesson-request-changed"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : lr.saveFailed);
    } finally {
      setPendingAction(null);
    }
  }

  async function openThread(requestId: string) {
    if (activeRequestId === requestId) {
      setActiveRequestId(null);
      setThread([]);
      return;
    }

    setPendingAction(`thread:${requestId}`);
    setMessage("");

    try {
      const response = await fetch(`/api/lesson-requests/${requestId}`);
      const payload = (await response.json()) as {
        data?: { thread?: ThreadMessage[] };
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error ?? lr.saveFailed);
      setActiveRequestId(requestId);
      setThread(payload.data?.thread ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : lr.saveFailed);
    } finally {
      setPendingAction(null);
    }
  }

  async function sendThreadMessage(requestId: string) {
    setPendingAction(`send:${requestId}`);
    setMessage("");

    try {
      const response = await fetch(`/api/lesson-requests/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: threadMessage }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? lr.saveFailed);

      setThreadMessage("");
      await openThread(requestId);
      await loadRequests();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : lr.saveFailed);
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <section className="-mx-4 bg-white px-4 py-4" data-testid="lesson-requests-panel" id="lesson-requests">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">{lr.eyebrow}</p>
          <h2 className="mt-1 text-lg font-black text-night">{lr.title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {role === "parent" ? lr.parentDesc : lr.teacherDesc}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-400">{lr.studentBlockedNote}</p>
        </div>
        {role === "parent" ? (
          <button
            className="zigo-compact-pill tap-scale zigo-cta shrink-0 rounded-lg px-3 py-2 text-xs font-black text-white"
            onClick={() => setShowComposer((current) => !current)}
            type="button"
          >
            {lr.newRequest}
          </button>
        ) : pendingCount > 0 ? (
          <span className="zigo-badge-count rounded-full bg-amber-500 px-2 py-1 text-white">{pendingCount}</span>
        ) : null}
      </div>

      {message ? <p className="mt-3 text-sm font-bold text-crystal">{message}</p> : null}

      {showComposer && role === "parent" ? (
        <div className="mt-4 space-y-3 rounded-2xl border border-cyan-100 bg-cyan-50/40 p-4">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{lr.chooseTeacher}</span>
            <select
              className="zigo-input mt-1 w-full rounded-xl px-3 py-2 text-sm font-semibold"
              onChange={(event) => setSelectedTeacherId(event.target.value)}
              value={selectedTeacherId}
            >
              <option value="">{lr.chooseTeacher}</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.full_name}
                  {teacher.organization_type ? ` · ${teacher.organization_type}` : ""}
                </option>
              ))}
            </select>
          </label>

          {teachers.length === 0 ? (
            <p className="text-sm font-semibold text-amber-700">{lr.noTeachers}</p>
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

          <button
            className="tap-scale zigo-cta w-full rounded-xl px-4 py-3 text-sm font-black text-white disabled:opacity-60"
            disabled={!selectedTeacherId || requestBody.trim().length < 10 || pendingAction === "create"}
            onClick={() => void createRequest()}
            type="button"
          >
            {pendingAction === "create" ? lr.sending : lr.sendRequest}
          </button>
        </div>
      ) : null}

      {loading ? (
        <p className="mt-4 text-sm font-semibold text-slate-500">{lr.sending}</p>
      ) : requests.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
          <p className="font-black text-night">{lr.emptyTitle}</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {role === "parent" ? lr.emptyParentDesc : lr.emptyTeacherDesc}
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {requests.map((item) => {
            const counterpart =
              role === "parent"
                ? item.receiver?.full_name ?? lr.toTeacher
                : item.sender?.full_name ?? lr.fromParent;
            const isTeacherPending = role === "teacher" && item.status === "pending" && item.receiver_id === viewerId;

            return (
              <article className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4" key={item.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-night">{counterpart}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                      {statusLabel(item.status, lr)}
                      {item.priority === "urgent" ? (
                        <span className="ml-2 rounded bg-rose-500 px-1.5 py-0.5 text-[0.65rem] text-white">
                          {lr.urgentBadge}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <time className="text-xs font-semibold text-slate-400">
                    {new Date(item.created_at).toLocaleDateString()}
                  </time>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-700">{item.message_body}</p>

                {isTeacherPending ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      className="tap-scale rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white"
                      disabled={pendingAction === item.id}
                      onClick={() => void updateStatus(item.id, "accepted")}
                      type="button"
                    >
                      {lr.accept}
                    </button>
                    <button
                      className="tap-scale rounded-xl bg-rose-500 px-3 py-2 text-xs font-black text-white"
                      disabled={pendingAction === item.id}
                      onClick={() => void updateStatus(item.id, "rejected")}
                      type="button"
                    >
                      {lr.reject}
                    </button>
                  </div>
                ) : null}

                {item.status === "accepted" ? (
                  <div className="mt-3 space-y-3">
                    <button
                      className="tap-scale text-sm font-black text-crystal"
                      onClick={() => void openThread(item.id)}
                      type="button"
                    >
                      {activeRequestId === item.id ? lr.hideThread : lr.openThread}
                    </button>

                    {activeRequestId === item.id ? (
                      <div className="space-y-2 rounded-xl border border-violet-100 bg-white p-3">
                        {thread.length === 0 ? (
                          <p className="text-sm font-semibold text-slate-500">{lr.threadHint}</p>
                        ) : (
                          thread.map((entry) => (
                            <div className="rounded-lg bg-slate-50 px-3 py-2" key={entry.id}>
                              <p className="text-xs font-black text-slate-500">
                                {entry.sender_id === viewerId ? lr.fromYou : entry.sender?.full_name}
                              </p>
                              <p className="mt-1 text-sm leading-6 text-slate-700">{entry.content}</p>
                            </div>
                          ))
                        )}
                        <label className="block">
                          <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                            {lr.writeMessage}
                          </span>
                          <textarea
                            className="zigo-input mt-1 min-h-20 w-full rounded-xl px-3 py-2 text-sm font-semibold"
                            onChange={(event) => setThreadMessage(event.target.value)}
                            value={threadMessage}
                          />
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="tap-scale zigo-cta rounded-xl px-3 py-2 text-xs font-black text-white disabled:opacity-60"
                            disabled={!threadMessage.trim() || pendingAction === `send:${item.id}`}
                            onClick={() => void sendThreadMessage(item.id)}
                            type="button"
                          >
                            {lr.sendMessage}
                          </button>
                          <button
                            className="tap-scale rounded-xl bg-slate-200 px-3 py-2 text-xs font-black text-night"
                            disabled={pendingAction === item.id}
                            onClick={() => void updateStatus(item.id, "closed")}
                            type="button"
                          >
                            {lr.close}
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
