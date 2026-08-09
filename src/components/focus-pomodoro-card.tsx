"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { displayEducationAreaName } from "@/lib/domain/education-catalog";
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
  userId?: string | null;
};

type FocusPhase = "idle" | "running" | "complete" | "shared";
type AmbientSoundType = "none" | "rain" | "lofi" | "waves";

const TOPIC_PRESET_KEYS = ["presetMath", "presetScience", "presetCoding", "presetExam"] as const;

export function FocusPomodoroCard({
  areas,
  isPremium = false,
  initialTopic,
  userId = null,
}: FocusPomodoroCardProps) {
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

  // Web Audio ambient sound state
  const { activeSound, playSound, stopSound } = useAmbientAudio();

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

  async function startSession(durationMinutes = 25) {
    if (loading || phase === "running") return;

    setLoading(true);
    setMessage("");
    const chosenSeconds = durationMinutes * 60;

    try {
      const response = await fetch("/api/learning/focus/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          areaId: areaId === "" ? undefined : areaId,
          topicLabel,
          targetSeconds: chosenSeconds,
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
      setTargetSeconds(payload.data.target_seconds ?? chosenSeconds);
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
      stopSound();
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
          caption: (shareCaption ?? "").trim() || undefined,
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
    stopSound();
    setSessionId(null);
    setElapsedSeconds(0);
    setTargetSeconds(POMODORO_SECONDS);
    setPhase("idle");
    setShareCaption("");
    setMessage("");
  }

  return (
    <section className="-mx-4 space-y-4 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 px-4 py-5 text-white shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.18em] backdrop-blur">
            <svg aria-hidden="true" className="size-3 text-amber-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            {z.focusMode}
          </span>
          <h1 className="mt-2 text-2xl font-black leading-tight">{z.studyWithMe}</h1>
          <p className="mt-1 text-sm font-bold text-white/85">{statusLabel}</p>
        </div>

        {/* Ambient Sound Controller Pill */}
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-[0.62rem] font-black uppercase tracking-[0.12em] text-white/70">Ortam Sesi</span>
          <div className="flex items-center gap-1 rounded-xl bg-black/25 p-1 backdrop-blur">
            <button
              title="Sessiz"
              className={`tap-scale flex size-7 items-center justify-center rounded-lg text-xs font-black transition ${
                activeSound === "none" ? "bg-white text-indigo-900 shadow" : "text-white/70 hover:text-white"
              }`}
              onClick={() => playSound("none")}
              type="button"
            >
              🔇
            </button>
            <button
              title="Yağmur Sesi"
              className={`tap-scale flex size-7 items-center justify-center rounded-lg text-xs font-black transition ${
                activeSound === "rain" ? "bg-white text-indigo-900 shadow" : "text-white/70 hover:text-white"
              }`}
              onClick={() => playSound("rain")}
              type="button"
            >
              🌧️
            </button>
            <button
              title="Lo-Fi Ritim"
              className={`tap-scale flex size-7 items-center justify-center rounded-lg text-xs font-black transition ${
                activeSound === "lofi" ? "bg-white text-indigo-900 shadow" : "text-white/70 hover:text-white"
              }`}
              onClick={() => playSound("lofi")}
              type="button"
            >
              🎵
            </button>
            <button
              title="Derin Dalga"
              className={`tap-scale flex size-7 items-center justify-center rounded-lg text-xs font-black transition ${
                activeSound === "waves" ? "bg-white text-indigo-900 shadow" : "text-white/70 hover:text-white"
              }`}
              onClick={() => playSound("waves")}
              type="button"
            >
              🌊
            </button>
          </div>
        </div>
      </div>

      {/* Main Countdown Display Box */}
      <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-black/25 p-4.5 backdrop-blur">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-white/70">{z.pomodoro}</p>
              {phase === "running" ? (
                <span className="flex items-center gap-1 text-[0.65rem] font-extrabold text-emerald-300">
                  <span className="size-2 animate-ping rounded-full bg-emerald-400" />
                  Canlı Odak
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-5xl font-black tabular-nums tracking-tight">{formatPomodoroCountdown(remainingSeconds)}</p>
          </div>
          <span className="rounded-xl border border-white/25 bg-white/15 px-3 py-2 text-xs font-black shadow-inner backdrop-blur">
            +{FOCUS_SESSION_POINTS} {fc.pts}
          </span>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/20 p-0.5">
          <span
            className="block h-full rounded-full bg-gradient-to-r from-amber-300 via-white to-emerald-300 transition-all duration-300 shadow-sm"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {phase === "idle" ? (
        <div className="space-y-3.5">
          {/* Preset Duration Selectors */}
          <div className="flex items-center gap-1.5">
            <span className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-white/75">Süre:</span>
            {[
              { min: 25, label: "25 dk" },
              { min: 50, label: "50 dk Derin" },
              { min: 15, label: "15 dk Hızlı" },
            ].map((dur) => (
              <button
                key={dur.min}
                className={`tap-scale rounded-full px-3 py-1 text-xs font-black transition ${
                  targetSeconds === dur.min * 60
                    ? "bg-white text-indigo-900 shadow"
                    : "bg-white/15 text-white hover:bg-white/25"
                }`}
                onClick={() => setTargetSeconds(dur.min * 60)}
                type="button"
              >
                {dur.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {TOPIC_PRESET_KEYS.map((key) => (
              <button
                className={`tap-scale rounded-full px-3.5 py-1.5 text-xs font-black transition ${
                  topicLabel === fc[key] ? "bg-white text-indigo-950 shadow-md" : "bg-white/15 text-white hover:bg-white/25"
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
              className="mt-1 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-white/50 focus:border-white/40 focus:ring-2 focus:ring-white/20"
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
                className="mt-1 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20"
                onChange={(event) => setAreaId(event.target.value ? Number(event.target.value) : "")}
                value={areaId}
              >
                {areas.map((area) => (
                  <option className="text-night font-bold" key={area.id} value={area.id}>
                    {displayEducationAreaName(area.area_name)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <button
            className="tap-scale zigo-cta w-full rounded-xl bg-white px-4 py-3.5 text-sm font-black text-indigo-950 shadow-lg disabled:opacity-60"
            disabled={loading || resuming || topicLabel.trim().length < 2}
            onClick={() => void startSession(Math.round(targetSeconds / 60))}
            type="button"
          >
            {fc.start25}
          </button>
        </div>
      ) : null}

      {phase === "running" ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur">
            <p className="text-sm font-black text-white">
              {topicLabel}
              {areaId !== ""
                ? ` · ${displayEducationAreaName(areas.find((area) => area.id === areaId)?.area_name) || fc.matchedArea}`
                : ""}
            </p>
            <p className="mt-1 text-xs font-semibold text-white/80">{fc.keepScreenOpen}</p>
          </div>
          {tabHiddenWarning ? (
            <p className="rounded-xl bg-amber-400/20 px-3.5 py-2.5 text-xs font-black text-amber-100 backdrop-blur">{fc.tabHidden}</p>
          ) : null}
          <button
            className="tap-scale w-full rounded-xl border border-white/30 px-4 py-3 text-sm font-black text-white hover:bg-white/10 transition"
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
                  className="mt-1 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-white/50"
                  maxLength={280}
                  onChange={(event) => setShareCaption(event.target.value)}
                  placeholder={fc.sharePlaceholder}
                  value={shareCaption}
                />
              </label>
              <button
                className="tap-scale w-full rounded-xl bg-white px-4 py-3.5 text-sm font-black text-indigo-950 shadow-md disabled:opacity-60"
                disabled={loading}
                onClick={() => void shareMoment()}
                type="button"
              >
                {fc.shareMoment}
              </button>
            </>
          ) : null}
          <div className="flex gap-2">
            <Link className="tap-scale flex-1 rounded-xl bg-white/15 px-4 py-3 text-center text-sm font-black hover:bg-white/25 transition" href="/">
              {fc.backToFeed}
            </Link>
            <button
              className="tap-scale flex-1 rounded-xl border border-white/30 px-4 py-3 text-sm font-black hover:bg-white/10 transition"
              onClick={resetSession}
              type="button"
            >
              {fc.newSession}
            </button>
          </div>
        </div>
      )}

      {message ? <p className="rounded-xl bg-black/20 p-3 text-sm font-bold text-white backdrop-blur">{message}</p> : null}
    </section>
  );
}

/** Web Audio API ambient sound generator custom hook */
function useAmbientAudio() {
  const [activeSound, setActiveSound] = useState<AmbientSoundType>("none");
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nodeRef = useRef<AudioNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  function stopSound() {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.1);
      setTimeout(() => {
        try {
          nodeRef.current?.disconnect();
          audioCtxRef.current?.close();
        } catch {}
        audioCtxRef.current = null;
        nodeRef.current = null;
        gainNodeRef.current = null;
      }, 150);
    }
    setActiveSound("none");
  }

  function playSound(type: AmbientSoundType) {
    stopSound();
    if (type === "none") return;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.08, ctx.currentTime);
      masterGain.connect(ctx.destination);
      gainNodeRef.current = masterGain;

      if (type === "rain") {
        // Pink noise generator for realistic rain ambience
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
          output[i] *= 0.11;
          b6 = white * 0.115926;
        }
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 1000;
        whiteNoise.connect(filter);
        filter.connect(masterGain);
        whiteNoise.start();
        nodeRef.current = whiteNoise;
      } else if (type === "lofi") {
        // Soft warm ambient drone chords
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.type = "sine";
        osc2.type = "triangle";
        osc1.frequency.setValueAtTime(220, ctx.currentTime); // A3
        osc2.frequency.setValueAtTime(329.63, ctx.currentTime); // E4

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(450, ctx.currentTime);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(masterGain);

        osc1.start();
        osc2.start();
        nodeRef.current = osc1;
      } else if (type === "waves") {
        // Deep ocean wave sweep
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(300, ctx.currentTime);

        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.15, ctx.currentTime); // slow wave cycle
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(200, ctx.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        noise.connect(filter);
        filter.connect(masterGain);

        noise.start();
        lfo.start();
        nodeRef.current = noise;
      }

      setActiveSound(type);
    } catch {
      setActiveSound("none");
    }
  }

  useEffect(() => {
    return () => {
      stopSound();
    };
  }, []);

  return { activeSound, playSound, stopSound };
}
