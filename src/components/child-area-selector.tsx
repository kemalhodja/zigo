"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { displayEducationAreaName } from "@/lib/domain/education-catalog";
import { isGeneralInterestArea } from "@/lib/domain/general-interest-areas";
import {
  EXAM_GRADE_LEVELS,
  filterAreasForGradeLevel,
  GRADE_LEVEL_OPTIONS,
  isAutoInterestGradeLevel,
  resolveAutoInterestAreaIds,
} from "@/lib/domain/grade-level";
import {
  filterAreasForLaunchScopedSelection,
  isLaunchBlockedExamTrack,
} from "@/lib/domain/launch-scope";
import { useMessages } from "@/lib/i18n/locale-context";
import type { Database } from "@/lib/supabase/database.types";

type EducationArea = Database["public"]["Tables"]["education_areas"]["Row"];

type ChildAreaSelectorProps = {
  childProfileId: string;
  areas: EducationArea[];
  initialSelectedAreaIds: number[];
  initialGradeLevel?: string | null;
};

export function ChildAreaSelector({
  childProfileId,
  areas,
  initialSelectedAreaIds,
  initialGradeLevel = null,
}: ChildAreaSelectorProps) {
  const m = useMessages();
  const c = m.childAreas;
  const router = useRouter();
  const [selectedGrade, setSelectedGrade] = useState<string | null>(initialGradeLevel);
  const [selectedAreaIds, setSelectedAreaIds] = useState(() => new Set(initialSelectedAreaIds));
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const classOptions = GRADE_LEVEL_OPTIONS.filter(
    (option) => !(EXAM_GRADE_LEVELS as readonly string[]).includes(option),
  );
  const examOptions = [...EXAM_GRADE_LEVELS].filter((option) => !isLaunchBlockedExamTrack(option));
  const autoGrade = isAutoInterestGradeLevel(selectedGrade);
  const gradeScopedAreas = useMemo(() => {
    if (!selectedGrade) return [];
    return filterAreasForLaunchScopedSelection(
      filterAreasForGradeLevel(areas, selectedGrade),
      selectedGrade,
    );
  }, [areas, selectedGrade]);
  const generalHobbies = useMemo(
    () =>
      filterAreasForLaunchScopedSelection(areas, selectedGrade).filter((area) =>
        isGeneralInterestArea(area),
      ),
    [areas, selectedGrade],
  );

  function selectGrade(grade: string) {
    setSelectedGrade(grade);
    setMessage("");
    if (isAutoInterestGradeLevel(grade)) {
      setSelectedAreaIds(new Set(resolveAutoInterestAreaIds(areas, grade)));
    } else {
      setSelectedAreaIds(new Set());
    }
  }

  function toggleArea(areaId: number) {
    if (autoGrade) return;
    setSelectedAreaIds((current) => {
      const next = new Set(current);
      if (next.has(areaId)) next.delete(areaId);
      else next.add(areaId);
      return next;
    });
  }

  async function saveAreas() {
    if (!selectedGrade) {
      setMessage("Önce sınıf seçin.");
      return;
    }
    if (selectedAreaIds.size === 0) {
      setMessage(c.selectOne);
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/children/areas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childProfileId,
          areaIds: [...selectedAreaIds],
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setMessage(payload?.error ?? c.saveFailed);
        setIsSaving(false);
        return;
      }

      setMessage(c.saved);
      setIsSaving(false);
      router.refresh();
    } catch {
      setMessage(m.common.connectionFailed);
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="space-y-2.5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-pink-50/40 p-4">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-crystal">Sınıf seç</p>
        <div className="flex flex-wrap gap-1.5">
          {classOptions.map((option) => {
            const isActive = selectedGrade === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => selectGrade(option)}
                className={`tap-scale rounded-lg px-2.5 py-1.5 text-xs font-black ${
                  isActive ? "bg-night text-white" : "border border-slate-200 bg-white text-slate-700"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
        <p className="pt-1 text-[0.65rem] font-black uppercase tracking-[0.14em] text-slate-500">
          Sınav / hazırlık
        </p>
        <div className="flex flex-wrap gap-1.5">
          {examOptions.map((option) => {
            const isActive = selectedGrade === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => selectGrade(option)}
                className={`tap-scale rounded-lg px-2.5 py-1.5 text-xs font-black ${
                  isActive
                    ? "bg-gradient-to-r from-crystal to-berry text-white"
                    : "border border-slate-200 bg-white text-slate-700"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </section>

      {!selectedGrade ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
          Önce sınıf veya sınav kademesini seçin.
        </p>
      ) : autoGrade ? (
        <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3">
          <p className="text-xs font-bold text-emerald-800">
            {selectedGrade} için tüm dersler otomatik seçildi ({selectedAreaIds.size} alan).
          </p>
          <div className="flex flex-wrap gap-1.5">
            {gradeScopedAreas
              .filter((area) => selectedAreaIds.has(area.id))
              .map((area) => (
                <span
                  key={area.id}
                  className="rounded-xl border border-emerald-200 bg-white px-3 py-1.5 text-xs font-black text-emerald-800"
                >
                  ✓ {displayEducationAreaName(area.area_name)}
                </span>
              ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-indigo-600">
            Branş seçimi ({gradeScopedAreas.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {gradeScopedAreas.map((area) => {
              const isSelected = selectedAreaIds.has(area.id);
              return (
                <button
                  className={`tap-scale rounded-xl border px-3 py-1.5 text-xs font-black transition ${
                    isSelected
                      ? "border-crystal bg-crystal text-white shadow-sm"
                      : "border-slate-200 bg-white text-night hover:border-crystal"
                  }`}
                  key={area.id}
                  onClick={() => toggleArea(area.id)}
                  type="button"
                >
                  {isSelected
                    ? `✓ ${displayEducationAreaName(area.area_name)}`
                    : `+ ${displayEducationAreaName(area.area_name)}`}
                </button>
              );
            })}
          </div>
          {generalHobbies.length > 0 ? (
            <div className="space-y-2 border-t border-slate-200/80 pt-3">
              <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-purple-600">
                İsteğe bağlı ilgi alanları
              </p>
              <div className="flex flex-wrap gap-1.5">
                {generalHobbies.map((area) => {
                  const isSelected = selectedAreaIds.has(area.id);
                  return (
                    <button
                      className={`tap-scale rounded-xl border px-3 py-1.5 text-xs font-black transition ${
                        isSelected
                          ? "border-crystal bg-crystal text-white shadow-sm"
                          : "border-slate-200 bg-white text-night hover:border-crystal"
                      }`}
                      key={area.id}
                      onClick={() => toggleArea(area.id)}
                      type="button"
                    >
                      {isSelected
                        ? `✓ ${displayEducationAreaName(area.area_name)}`
                        : `+ ${displayEducationAreaName(area.area_name)}`}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      )}

      <button
        className="tap-scale w-full rounded-lg bg-night px-4 py-3 text-sm font-black text-white disabled:opacity-60"
        disabled={isSaving || !selectedGrade || selectedAreaIds.size === 0}
        onClick={() => void saveAreas()}
        type="button"
      >
        {isSaving ? m.common.saving : m.common.save}
      </button>

      {message ? <p className="text-xs font-bold text-slate-600">{message}</p> : null}
    </div>
  );
}
