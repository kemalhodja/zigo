"use client";

import { useCallback, useEffect, useState } from "react";

// Web Audio API Context (Singleton)
let audioCtx: AudioContext | null = null;

const SOUND_PREF_KEY = "zigo:sound-enabled";
const SOUND_CHANGE_EVENT = "zigo:sound-change";

let mutedSingleton = false;
let prefLoaded = false;

function loadMuted(): boolean {
  if (!prefLoaded && typeof window !== "undefined") {
    try {
      mutedSingleton = window.localStorage.getItem(SOUND_PREF_KEY) === "off";
    } catch {
      // localStorage kullanılamıyorsa ses açık kalır
    }
    prefLoaded = true;
  }
  return mutedSingleton;
}

function persistMuted(next: boolean) {
  mutedSingleton = next;
  prefLoaded = true;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(SOUND_PREF_KEY, next ? "off" : "on");
    } catch {
      // Yazılamazsa yalnızca oturumluk uygulanır
    }
    window.dispatchEvent(
      new CustomEvent(SOUND_CHANGE_EVENT, { detail: { muted: next } })
    );
  }
}

export type HapticPattern = number | number[];

export function haptic(pattern: HapticPattern) {
  if (typeof navigator === "undefined") return;
  const nav = navigator as { vibrate?: (p: HapticPattern) => boolean };
  const vibrate = nav.vibrate;
  if (typeof vibrate !== "function") return;
  try {
    vibrate(pattern);
  } catch {
    // Titreşim desteklenmiyorsa sessizce yoksay
  }
}

function getAudioContext() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export type SoundType =
  | "pop"
  | "click"
  | "error"
  | "success"
  | "clear"
  | "water"
  | "wrong"
  | "streak"
  | "level_up"
  | "perfect"
  | "coin";

const HAPTIC_BY_SOUND: Record<SoundType, HapticPattern> = {
  pop: 8,
  click: 5,
  error: [40, 40, 40],
  success: [20, 40, 20],
  clear: 12,
  water: 12,
  wrong: [40, 0, 40],
  streak: [10, 20, 15, 20, 20, 20, 25, 20, 30, 20, 35],
  level_up: [30, 50, 30, 50, 60],
  perfect: [10, 20, 20, 20, 30, 20, 40, 20, 50],
  coin: [8, 20, 12],
};

export function useAudio() {
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    setIsMuted(loadMuted());

    const sync = (event: Event) => {
      const detail = (event as CustomEvent<{ muted?: boolean }>).detail;
      setIsMuted(typeof detail?.muted === "boolean" ? detail.muted : loadMuted());
    };
    const syncStorage = (event: StorageEvent) => {
      if (event.key === SOUND_PREF_KEY) {
        prefLoaded = false;
        setIsMuted(loadMuted());
      }
    };

    window.addEventListener(SOUND_CHANGE_EVENT, sync);
    window.addEventListener("storage", syncStorage);
    return () => {
      window.removeEventListener(SOUND_CHANGE_EVENT, sync);
      window.removeEventListener("storage", syncStorage);
    };
  }, []);

  const playSound = useCallback((type: SoundType) => {
    haptic(HAPTIC_BY_SOUND[type]);

    if (loadMuted()) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;

    // ── Mevcut sesler ──────────────────────────────────────────────
    if (type === "pop" || type === "click") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(type === "pop" ? 600 : 800, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === "error") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === "success") {
      // Kısa başarı arpeji — A4 → C#5 → E5 → A5
      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554.37, now + 0.1);
      osc.frequency.setValueAtTime(659.25, now + 0.2);
      osc.frequency.setValueAtTime(880, now + 0.3);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === "clear") {
      // Kristal çınlaması
      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(2000, now + 0.3);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === "water") {
      // Su sesi (pipe connect)
      osc.type = "triangle";
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.linearRampToValueAtTime(300, now + 0.05);
      osc.frequency.linearRampToValueAtTime(200, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    }

    // ── Yeni oyun sesleri ─────────────────────────────────────────────
    else if (type === "wrong") {
      // Yanlış: düşen sawtooth tok ses
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(130, now + 0.25);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === "streak") {
      // Seri: hızlanan yükselen arpeggio (C4 → E4 → G4 → B4 → D5)
      osc.type = "triangle";
      const notes = [261.63, 329.63, 392.0, 493.88, 587.33];
      const step = 0.08;
      notes.forEach((freq, i) => {
        osc.frequency.setValueAtTime(freq, now + i * step);
      });
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.01, now + notes.length * step + 0.1);
      osc.start(now);
      osc.stop(now + notes.length * step + 0.1);
    } else if (type === "level_up") {
      // Seviye atla: fanfare (C4 → E4 → G4 → C5 uzun)
      osc.type = "triangle";
      osc.frequency.setValueAtTime(261.63, now);
      osc.frequency.setValueAtTime(329.63, now + 0.12);
      osc.frequency.setValueAtTime(392.0, now + 0.24);
      osc.frequency.setValueAtTime(523.25, now + 0.36);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.setValueAtTime(0.25, now + 0.36);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.8);
      osc.start(now);
      osc.stop(now + 0.8);
    } else if (type === "perfect") {
      // Mükemmel: oktav çıkışı + uzun sustain (E4 → E5)
      osc.type = "sine";
      osc.frequency.setValueAtTime(329.63, now);
      osc.frequency.setValueAtTime(392.0, now + 0.1);
      osc.frequency.setValueAtTime(523.25, now + 0.2);
      osc.frequency.setValueAtTime(659.25, now + 0.3);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.setValueAtTime(0.25, now + 0.3);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.7);
      osc.start(now);
      osc.stop(now + 0.7);
    } else if (type === "coin") {
      // Jeton/puan kazanma: klasik kısa coin
      osc.type = "square";
      osc.frequency.setValueAtTime(988.0, now);
      osc.frequency.setValueAtTime(1318.5, now + 0.06);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    }
  }, []);

  const toggleAudio = useCallback(() => {
    persistMuted(!loadMuted());
  }, []);

  return { playSound, toggleAudio, isMuted };
}
