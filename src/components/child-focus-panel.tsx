"use client";

import { useEffect, useRef, useState } from "react";

import { formatPomodoroCountdown, pomodoroProgress } from "@/lib/domain/focus-gamification";
import { useMessages } from "@/lib/i18n/locale-context";

type ChildFocusPanelProps = {
  childProfileId: string;
  childName: string;
};

export function ChildFocusPanel({ childProfileId, childName }: ChildFocusPanelProps) {
  const { childPanels: c, actions: a } = useMessages();
  const [topicLabel, setTopicLabel] = useState(c.studyBlock.replace("{name}", childName));
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [targetSeconds, setTargetSeconds] = useState(1500);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const completingRef = useRef(false);

  const remainingSeconds = Math.max(0, targetSeconds - elapsedSeconds);

  useEffect(() => {
    if (phase !== "running") return;
    const id = window.setInterval(() => setElapsedSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "running" || elapsedSeconds < targetSeconds) return;
    void completeSession();
  }, [elapsedSeconds, phase, targetSeconds]);

  async function startSession() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/learning/focus/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicLabel, childProfileId }),
      });
      const payload = (await response.json().catch(() => null)) as {
        data?: { id: string; target_seconds: number };
        error?: string;
      } | null;
      if (!response.ok || !payload?.data) {
        setMessage(payload?.error ?? c.startFailed);
        return;
      }
      setSessionId(payload.data.id);
      setTargetSeconds(payload.data.target_seconds);
      setElapsedSeconds(0);
      setPhase("running");
    } catch {
      setMessage(a.connectionFailed);
    } finally {
      setLoading(false);
    }
  }

  async function completeSession() {
    if (!sessionId || loading || completingRef.current || phase !== "running") return;
    completingRef.current = true;
    setLoading(true);
    setPhase("done");
    try {
      const response = await fetch("/api/learning/focus/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const payload = (await response.json().catch(() => null)) as {
        data?: { points_awarded: number };
        error?: string;
      } | null;
      if (!response.ok || !payload?.data) {
        setPhase("running");
        setMessage(payload?.error ?? c.completeFailed);
        return;
      }
      setMessage(c.childPointsRecorded.replace("{points}", String(payload.data.points_awarded)));
    } catch {
      setPhase("running");
      setMessage(a.connectionFailed);
    } finally {
      completingRef.current = false;
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-violet-100 bg-violet-50/70 p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-crystal">{c.supervisedFocus}</p>
      <p className="mt-1 text-sm font-bold text-slate-600">{c.startPomodoroDesc.replace("{name}", childName)}</p>
      {phase === "idle" ? (
        <div className="mt-3 space-y-2">
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold"
            onChange={(event) => setTopicLabel(event.target.value)}
            value={topicLabel}
          />
          <button
            className="zigo-cta w-full rounded-lg px-4 py-2 text-sm font-black text-white disabled:opacity-60"
            disabled={loading}
            onClick={() => void startSession()}
            type="button"
          >
            {c.startChildFocus}
          </button>
        </div>
      ) : (
        <div className="mt-3">
          <p className="text-3xl font-black tabular-nums text-night">{formatPomodoroCountdown(remainingSeconds)}</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
            <span className="block h-full rounded-full bg-crystal" style={{ width: `${pomodoroProgress(elapsedSeconds, targetSeconds)}%` }} />
          </div>
        </div>
      )}
      {message ? <p className="mt-2 text-xs font-bold text-slate-600">{message}</p> : null}
    </section>
  );
}
