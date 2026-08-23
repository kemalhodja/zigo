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
    const Ctor = window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export type SoundType = "pop" | "success" | "error" | "clear" | "water" | "click";

const HAPTIC_BY_SOUND: Record<SoundType, HapticPattern> = {
  pop: 8,
  click: 5,
  error: [40, 40, 40],
  success: [20, 40, 20],
  clear: 12,
  water: 12,
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

    if (type === "pop" || type === "click") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(type === "pop" ? 600 : 800, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } 
    else if (type === "error") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } 
    else if (type === "success") {
      // Hızlı bir başarı arp'i (Arpeggio)
      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.setValueAtTime(554.37, now + 0.1); // C#5
      osc.frequency.setValueAtTime(659.25, now + 0.2); // E5
      osc.frequency.setValueAtTime(880, now + 0.3); // A5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    }
    else if (type === "clear") {
      // Blok temizleme (kristal çınlaması)
      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(2000, now + 0.3);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
    else if (type === "water") {
      // Boru bağlantısı su sesi (hafif bir gurgle)
      osc.type = "triangle";
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.linearRampToValueAtTime(300, now + 0.05);
      osc.frequency.linearRampToValueAtTime(200, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  }, []);

  const toggleAudio = useCallback(() => {
    persistMuted(!loadMuted());
  }, []);

  return { playSound, toggleAudio, isMuted };
}
