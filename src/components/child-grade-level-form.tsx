"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { GRADE_LEVEL_OPTIONS } from "@/lib/domain/grade-level";

type ChildGradeLevelFormProps = {
  childProfileId: string;
  childName: string;
  initialGradeLevel?: string | null;
};

export function ChildGradeLevelForm({
  childProfileId,
  childName,
  initialGradeLevel = "",
}: ChildGradeLevelFormProps) {
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
      const response = await fetch("/api/children/grade", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childProfileId, gradeLevel }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setStatus("error");
        setMessage(payload?.error ?? "Sınıf güncellenemedi.");
        return;
      }

      setStatus("saved");
      setMessage("Öğrenci sınıfı kaydedildi.");
      router.refresh();
    } catch {
      setStatus("error");
      setMessage("Bağlantı hatası.");
    }
  }

  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-3">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Sınıf</p>
      <p className="mt-1 text-sm font-black text-night">{childName}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <select
          className="min-w-0 flex-1 rounded-lg bg-white px-3 py-2.5 text-sm font-bold text-slate-700 outline-none"
          onChange={(event) => {
            setGradeLevel(event.target.value);
            setStatus("idle");
          }}
          value={gradeLevel}
        >
          <option value="">Sınıf seçin</option>
          {GRADE_LEVEL_OPTIONS.filter((option) => option !== "Veli").map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <button
          className="rounded-lg bg-night px-4 py-2.5 text-xs font-black text-white disabled:opacity-60"
          disabled={status === "saving"}
          onClick={() => void save()}
          type="button"
        >
          {status === "saving" ? "..." : "Kaydet"}
        </button>
      </div>
      {message ? (
        <p className={`mt-2 text-xs font-bold ${status === "error" ? "text-red-600" : "text-emerald-600"}`}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
