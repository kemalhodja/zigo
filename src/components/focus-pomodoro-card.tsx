"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  FOCUS_SESSION_POINTS,
  formatPomodoroCountdown,
  POMODORO_SECONDS,
  pomodoroProgress,
} from "@/lib/domain/focus-gamification";
import { useMessages } from "@/lib/i18n/locale-context";

type FocusAreaOption = {
  id: number;
  area_name: string;
};

type FocusPomodoroCardProps = {
  areas: FocusAreaOption[];
  isPremium?: boolean;
  initialTopic?: string;
};

type FocusPhase = "idle" | "running" | "complete" | "shared";

const TOPIC_PRESET_KEYS = ["presetMath", "presetScience", "presetCoding", "presetExam"] as const;

export function FocusPomodoroCard({ areas, isPremium = false, initialTopic }: FocusPomodoroCardProps) {
  const m = useMessages();
  const fc = m.focusCard;
  const z = m.zigo;
  const c = m.common;
  const [areaId, setAreaId] = useState<number | "">(areas[0]?.id ?? "");
  const [topicLabel, setTopicLabel] = useState(initialTopic ?? fc.presetMath);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [targetSeconds, setTargetSeconds] = useState(POMODORO_SECONDS);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [phase, setPhase] = useState<FocusPhase>("idle");
  const [message, setMessage] = useState("");
  const [shareCaption, setShareCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [tabHiddenWarning, setTabHiddenWarning] = useState(false);
  const [resuming, setResuming] = useState(true);

  const remainingSeconds = Math.max(0, targetSeconds - elapsedSeconds);
  const progress = pomodoroProgress(elapsedSeconds, targetSeconds);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/learning/focus/active");
        const payload = (await response.json().catch(() => null)) as {
          data?: {
            id: string;
            area_id: number | null;
            topic_label: string;
            target_seconds: number;
            started_at: string;
          } | null;
        } | null;

        const session = payload?.data;
        if (!session) return;

        const elapsed = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000);
        setSessionId(session.id);
        setTargetSeconds(session.target_seconds ?? POMODORO_SECONDS);
        setTopicLabel(session.topic_label);
        setAreaId(session.area_id ?? areas[0]?.id ?? "");
        setElapsedSeconds(Math.max(0, elapsed));
        setPhase("running");
      } finally {
        setResuming(false);
      }
    })();
  }, [areas]);

  useEffect(() => {
    if (phase !== "running") return;

    const timer = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "running") return;

    function handleVisibilityChange() {
      setTabHiddenWarning(document.visibilityState === "hidden");
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [phase]);

  useEffect(() => {
    if (phase !== "running") return;

    let wakeLock: WakeLockSentinel | null = null;

    void (async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await navigator.wakeLock.request("screen");
        }
      } catch {
        // optional on unsupported browsers
      }
    })();

    return () => {
      void wakeLock?.release();
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "running") return;
    if (elapsedSeconds < targetSeconds) return;
    void finishSession();
  }, [elapsedSeconds, phase, targetSeconds]);

  const statusLabel = useMemo(() => {
    if (phase === "idle") return fc.ready;
    if (phase === "running") return isPremium ? fc.focusPremium : fc.focusFree;
    if (phase === "complete") return fc.complete;
    return fc.shared;
  }, [fc, isPremium, phase]);

  async function startSession() {
    if (loading || phase === "running") return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/learning/focus/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          areaId: areaId === "" ? undefined : areaId,
          topicLabel,
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        data?: { id: string; target_seconds: number };
        error?: string;
      } | null;

      if (!response.ok || !payload?.data) {
        setMessage(payload?.error ?? fc.startFailed);
        setLoading(false);
        return;
      }

      setSessionId(payload.data.id);
      setTargetSeconds(payload.data.target_seconds ?? POMODORO_SECONDS);
      setElapsedSeconds(0);
      setPhase("running");
    } catch {
      setMessage(c.connectionFailed);
    } finally {
      setLoading(false);
    }
  }

  async function finishSession() {
    if (!sessionId || loading) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/learning/focus/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const payload = (await response.json().catch(() => null)) as {
        data?: { points_awarded: number; already_awarded: boolean; total_points: number };
        error?: string;
      } | null;

      if (!response.ok || !payload?.data) {
        setMessage(payload?.error ?? fc.sessionCompleteFailed);
        setLoading(false);
        return;
      }

      setPhase("complete");
      setMessage(
        payload.data.already_awarded
          ? fc.pointsAlreadyClaimedSession
          : fc.pointsEarnedSession
              .replace("{earned}", String(payload.data.points_awarded))
              .replace("{total}", String(payload.data.total_points)),
      );
    } catch {
      setMessage(c.connectionFailed);
    } finally {
      setLoading(false);
    }
  }

  async function shareMoment() {
    if (!sessionId || loading) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/learning/focus/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          caption: shareCaption.trim() || undefined,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setMessage(payload?.error ?? fc.shareFailed);
        setLoading(false);
        return;
      }

      setPhase("shared");
      setMessage(fc.shareSuccess);
    } catch {
      setMessage(c.connectionFailed);
    } finally {
      setLoading(false);
    }
  }

  function resetSession() {
    setSessionId(null);
    setElapsedSeconds(0);
    setTargetSeconds(POMODORO_SECONDS);
    setPhase("idle");
    setShareCaption("");
    setMessage("");
  }

  return (
    <section className="-mx-4 space-y-4 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 px-4 py-5 text-white">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-white/75">{z.focusMode}</p>
        <h1 className="mt-1 text-2xl font-black leading-tight">{z.studyWithMe}</h1>
        <p className="mt-2 text-sm font-bold leading-6 text-white/85">{statusLabel}</p>
      </div>

      <div className="rounded-2xl bg-black/20 p-4 backdrop-blur">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-white/70">{z.pomodoro}</p>
            <p className="mt-1 text-5xl font-black tabular-nums">{formatPomodoroCountdown(remainingSeconds)}</p>
          </div>
          <span className="rounded-lg bg-white/15 px-3 py-2 text-xs font-black">+{FOCUS_SESSION_POINTS} {fc.pts}</span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">
          <span className="block h-full rounded-full bg-white transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {phase === "idle" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {TOPIC_PRESET_KEYS.map((key) => (
              <button
                className={`rounded-full px-3 py-1.5 text-xs font-black ${
                  topicLabel === fc[key] ? "bg-white text-violet-700" : "bg-white/15 text-white"
                }`}
                key={key}
                onClick={() => setTopicLabel(fc[key])}
                type="button"
              >
                {fc[key]}
              </button>
            ))}
          </div>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.14em] text-white/75">{fc.topic}</span>
            <input
              className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-white/50 focus:border-white/40"
              maxLength={120}
              onChange={(event) => setTopicLabel(event.target.value)}
              placeholder={fc.topicPlaceholder}
              value={topicLabel}
            />
          </label>
          {areas.length > 0 ? (
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.14em] text-white/75">{fc.area}</span>
              <select
                className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white outline-none focus:border-white/40"
                onChange={(event) => setAreaId(event.target.value ? Number(event.target.value) : "")}
                value={areaId}
              >
                {areas.map((area) => (
                  <option className="text-night" key={area.id} value={area.id}>
                    {area.area_name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <button
            className="tap-scale zigo-cta w-full rounded-lg bg-white px-4 py-3 text-sm font-black text-violet-700 disabled:opacity-60"
            disabled={loading || resuming || topicLabel.trim().length < 2}
            onClick={() => void startSession()}
            type="button"
          >
            {fc.start25}
          </button>
        </div>
      ) : null}

      {phase === "running" ? (
        <div className="space-y-3">
          <p className="text-sm font-bold text-white/90">
            {topicLabel}
            {areaId !== "" ? ` · ${areas.find((area) => area.id === areaId)?.area_name ?? fc.matchedArea}` : ""}
          </p>
          <p className="text-xs font-bold text-white/75">{fc.keepScreenOpen}</p>
          {tabHiddenWarning ? (
            <p className="rounded-lg bg-amber-400/20 px-3 py-2 text-xs font-black text-amber-100">{fc.tabHidden}</p>
          ) : null}
          <button
            className="w-full rounded-lg border border-white/30 px-4 py-3 text-sm font-black text-white"
            disabled={loading}
            onClick={resetSession}
            type="button"
          >
            {fc.cancelSession}
          </button>
        </div>
      ) : null}

      {(phase === "complete" || phase === "shared") && (
        <div className="space-y-3">
          {phase === "complete" ? (
            <>
              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-white/75">{fc.shareCaption}</span>
                <input
                  className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-white/50"
                  maxLength={280}
                  onChange={(event) => setShareCaption(event.target.value)}
                  placeholder={fc.sharePlaceholder}
                  value={shareCaption}
                />
              </label>
              <button
                className="tap-scale w-full rounded-lg bg-white px-4 py-3 text-sm font-black text-violet-700 disabled:opacity-60"
                disabled={loading}
                onClick={() => void shareMoment()}
                type="button"
              >
                {fc.shareMoment}
              </button>
            </>
          ) : null}
          <div className="flex gap-2">
            <Link className="tap-scale flex-1 rounded-lg bg-white/15 px-4 py-3 text-center text-sm font-black" href="/">
              {fc.backToFeed}
            </Link>
            <button
              className="flex-1 rounded-lg border border-white/30 px-4 py-3 text-sm font-black"
              onClick={resetSession}
              type="button"
            >
              {fc.newSession}
            </button>
          </div>
        </div>
      )}

      {message ? <p className="text-sm font-bold text-white/90">{message}</p> : null}
    </section>
  );
}
