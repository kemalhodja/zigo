"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  EXAM_GRADE_LEVELS,
  GRADE_LEVEL_OPTIONS,
  isAutoInterestGradeLevel,
} from "@/lib/domain/grade-level";

type GradeLevelFormProps = {
  initialGradeLevel?: string | null;
  title?: string;
  description?: string;
};

export function GradeLevelForm({
  initialGradeLevel = "",
  title = "Sınıf seç",
  description = "Sınıfınızı seçin. 1-8. sınıflarda dersler otomatik atanır; diğer kademelerde branş seçimi yapılır.",
}: GradeLevelFormProps) {
  const router = useRouter();
  const [gradeLevel, setGradeLevel] = useState(initialGradeLevel ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  const classOptions = GRADE_LEVEL_OPTIONS.filter(
    (option) => !(EXAM_GRADE_LEVELS as readonly string[]).includes(option),
  );
  const examOptions = [...EXAM_GRADE_LEVELS];

  async function save(nextGrade = gradeLevel) {
    if (!nextGrade) {
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
        body: JSON.stringify({ gradeLevel: nextGrade }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        autoAssigned?: boolean;
        areaIds?: number[];
      } | null;

      if (!response.ok) {
        setStatus("error");
        setMessage(payload?.error ?? "Sınıf güncellenemedi.");
        return;
      }

      setGradeLevel(nextGrade);
      setStatus("saved");
      if (payload?.autoAssigned) {
        setMessage(
          `Sınıf kaydedildi. ${payload.areaIds?.length ?? 0} ders otomatik seçildi.`,
        );
      } else if (isAutoInterestGradeLevel(nextGrade)) {
        setMessage("Sınıf kaydedildi.");
      } else {
        setMessage("Sınıf kaydedildi. Şimdi branş seçin.");
      }
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

      <div className="mt-4 space-y-3">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-slate-500">Sınıf</p>
        <div className="flex flex-wrap gap-2">
          {classOptions.map((option) => {
            const isActive = gradeLevel === option;
            return (
              <button
                key={option}
                type="button"
                disabled={status === "saving"}
                onClick={() => {
                  setGradeLevel(option);
                  setStatus("idle");
                  void save(option);
                }}
                className={`tap-scale rounded-lg px-3 py-2 text-xs font-black transition ${
                  isActive
                    ? "bg-night text-white"
                    : "border border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>

        <p className="pt-1 text-[0.65rem] font-black uppercase tracking-[0.16em] text-slate-500">
          Sınav / hazırlık
        </p>
        <div className="flex flex-wrap gap-2">
          {examOptions.map((option) => {
            const isActive = gradeLevel === option;
            return (
              <button
                key={option}
                type="button"
                disabled={status === "saving"}
                onClick={() => {
                  setGradeLevel(option);
                  setStatus("idle");
                  void save(option);
                }}
                className={`tap-scale rounded-lg px-3 py-2 text-xs font-black transition ${
                  isActive
                    ? "bg-gradient-to-r from-crystal to-berry text-white"
                    : "border border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      {message ? (
        <p
          className={`mt-3 text-sm font-bold ${status === "error" ? "text-red-600" : "text-emerald-600"}`}
          id="grade-level-message"
        >
          {message}
        </p>
      ) : null}
    </section>
  );
}
