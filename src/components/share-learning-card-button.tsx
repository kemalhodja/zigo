"use client";

import { useState } from "react";

import { useMessages } from "@/lib/i18n/locale-context";

type ShareLearningCardButtonProps = {
  streakDays: number;
  points: number;
  missionDone: number;
  missionTotal?: number;
};

export function ShareLearningCardButton({
  streakDays,
  points,
  missionDone,
  missionTotal = 5,
}: ShareLearningCardButtonProps) {
  const m = useMessages();
  const [message, setMessage] = useState("");

  async function share() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/share/learning?streak=${streakDays}&points=${points}&done=${missionDone}&total=${missionTotal}`
        : "/share/learning";
    const text = `Zigo’da bugün ${missionDone}/${missionTotal} görev · ${streakDays} gün streak · ${points} puan`;

    try {
      if (navigator.share) {
        await navigator.share({ title: "Zigo öğrenme kartı", text, url });
        setMessage("Paylaşıldı");
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setMessage(m.common.done);
    } catch {
      setMessage(url);
    }
  }

  return (
    <div className="mt-3">
      <button
        className="tap-scale w-full rounded-xl bg-white/15 px-3 py-2.5 text-sm font-black text-white backdrop-blur hover:bg-white/25"
        onClick={() => void share()}
        type="button"
      >
        Öğrenme kartını paylaş
      </button>
      {message ? <p className="mt-1 text-center text-[0.65rem] font-bold text-white/80">{message}</p> : null}
    </div>
  );
}
