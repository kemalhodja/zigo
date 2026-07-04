"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { GRADE_LEVEL_OPTIONS } from "@/lib/domain/grade-level";

type GradeLevelFormProps = {
  initialGradeLevel?: string | null;
  title?: string;
  description?: string;
};

export function GradeLevelForm({
  initialGradeLevel = "",
  title = "Sınıf güncelle",
  description = "Eşleşen içerik ve yazılı hazırlık önerileri için sınıfınızı seçin.",
}: GradeLevelFormProps) {
  const router = useRouter();
  const [gradeLevel, setGradeLevel] = useState(initialGradeLevel ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  async function save() {
    if (!gradeLevel) {
      setStatus("error");
      setMessage("Lütfen bir sınıf seçin.");
      return;
    }

    setStatus("saving");
    setMessage("");

    try {
      const response = await fetch("/api/profile/grade", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gradeLevel }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setStatus("error");
        setMessage(payload?.error ?? "Sınıf güncellenemedi.");
        return;
      }

      setStatus("saved");
      setMessage("Sınıf kaydedildi.");
      router.refresh();
    } catch {
      setStatus("error");
      setMessage("Bağlantı hatası.");
    }
  }

  return (
    <section className="-mx-4 border-y border-slate-100 bg-white px-4 py-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Profil</p>
      <h2 className="mt-1 text-lg font-black text-night">{title}</h2>
      <p className="mt-1 text-sm font-semibold text-slate-500">{description}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <select
          className="min-w-0 flex-1 rounded-lg bg-slate-100 px-3 py-3 text-sm font-bold text-slate-700 outline-none"
          onChange={(event) => {
            setGradeLevel(event.target.value);
            setStatus("idle");
          }}
          value={gradeLevel}
        >
          <option value="">Sınıf seçin</option>
          {GRADE_LEVEL_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <button
          className="tap-scale rounded-lg bg-night px-4 py-3 text-sm font-black text-white disabled:opacity-60"
          disabled={status === "saving"}
          onClick={() => void save()}
          type="button"
        >
          {status === "saving" ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>

      {message ? (
        <p className={`mt-2 text-sm font-bold ${status === "error" ? "text-red-600" : "text-emerald-600"}`}>
          {message}
        </p>
      ) : null}
    </section>
  );
}
