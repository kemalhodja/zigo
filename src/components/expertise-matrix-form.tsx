"use client";

import { useState } from "react";

import { EXPERTISE_TRACKS } from "@/lib/domain/teacher-expertise";

type ExpertiseMatrixFormProps = {
  initialSlugs?: string[];
};

export function ExpertiseMatrixForm({ initialSlugs = [] }: ExpertiseMatrixFormProps) {
  const [selected, setSelected] = useState<string[]>(initialSlugs);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  function toggle(slug: string) {
    setSelected((current) =>
      current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug],
    );
  }

  async function save() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/profile/expertise-matrix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackSlugs: selected }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setMessage(payload?.error ?? "Kaydedilemedi.");
        return;
      }
      setMessage("Uzmanlık matrisi güncellendi.");
    } catch {
      setMessage("Bağlantı hatası.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">Uzmanlık Matrisi</p>
      <p className="mt-1 text-sm text-slate-600">
        Velilerin sizi nokta atışı bulması için alt dalları işaretleyin.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {EXPERTISE_TRACKS.map((track) => {
          const active = selected.includes(track.slug);
          return (
            <button
              className={`tap-scale rounded-full px-3 py-1.5 text-xs font-black ring-1 ring-inset transition ${
                active ? track.pillClass : "bg-white text-slate-500 ring-slate-200"
              }`}
              key={track.slug}
              onClick={() => toggle(track.slug)}
              type="button"
            >
              {track.label}
            </button>
          );
        })}
      </div>
      <button
        className="tap-scale mt-4 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-black text-white disabled:opacity-60"
        disabled={busy || selected.length === 0}
        onClick={() => void save()}
        type="button"
      >
        {busy ? "Kaydediliyor…" : "Matrisi kaydet"}
      </button>
      {message ? <p className="mt-2 text-sm font-bold text-slate-600">{message}</p> : null}
    </section>
  );
}
