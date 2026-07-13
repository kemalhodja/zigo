"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { GradeCategoryKey } from "@/lib/domain/education-catalog";
import { groupEducationAreasByGrade, resolveGradeCategory } from "@/lib/domain/education-catalog";
import { useMessages } from "@/lib/i18n/locale-context";
import type { Database } from "@/lib/supabase/database.types";

type EducationArea = Database["public"]["Tables"]["education_areas"]["Row"];

type ChildAreaSelectorProps = {
  childProfileId: string;
  areas: EducationArea[];
  initialSelectedAreaIds: number[];
};

export function ChildAreaSelector({
  childProfileId,
  areas,
  initialSelectedAreaIds,
}: ChildAreaSelectorProps) {
  const m = useMessages();
  const c = m.childAreas;
  const gradeLabels = m.education.gradeCategories;
  const router = useRouter();
  const [selectedAreaIds, setSelectedAreaIds] = useState(() => new Set(initialSelectedAreaIds));
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [gradeFilter, setGradeFilter] = useState<GradeCategoryKey | "all">(() => {
    if (initialSelectedAreaIds.length > 0) {
      const areaMap = new Map(areas.map((a) => [a.id, a]));
      for (const id of initialSelectedAreaIds) {
        const found = areaMap.get(id);
        if (found) {
          const cat = resolveGradeCategory(found.age_group);
          if (cat === "primary" || cat === "middle" || cat === "high" || cat === "preschool") {
            return cat;
          }
        }
      }
    }
    return "primary";
  });
  const [showOtherGrades, setShowOtherGrades] = useState(false);

  const groupedAreas = useMemo(() => groupEducationAreasByGrade(areas), [areas]);
  const { matchingGradeAreas, generalHobbies, otherGradeAreas } = useMemo(() => {
    const matching: EducationArea[] = [];
    const hobbies: EducationArea[] = [];
    const others: EducationArea[] = [];

    for (const area of areas) {
      const cat = resolveGradeCategory(area.age_group);
      if (cat === gradeFilter) {
        matching.push(area);
      } else if (cat === "generalInterest" || cat === "general") {
        hobbies.push(area);
      } else {
        others.push(area);
      }
    }
    return { matchingGradeAreas: matching, generalHobbies: hobbies, otherGradeAreas: others };
  }, [areas, gradeFilter]);

  function toggleArea(areaId: number) {
    setSelectedAreaIds((current) => {
      const next = new Set(current);
      if (next.has(areaId)) next.delete(areaId);
      else next.add(areaId);
      return next;
    });
  }

  async function saveAreas() {
    if (isSaving) return;
    if (selectedAreaIds.size === 0) {
      setMessage(c.selectOne);
      return;
    }

    setIsSaving(true);
    setMessage(c.saving);

    try {
      const response = await fetch("/api/children/interests", {
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
        return;
      }

      setMessage(c.saved);
      router.refresh();
    } catch {
      setMessage(m.actions.tryAgain);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">{c.step}</p>
          <p className="mt-1 text-sm font-black text-night">{c.title}</p>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{c.desc}</p>
        </div>
        <button
          className="tap-scale rounded-lg bg-crystal px-4 py-2 text-xs font-black text-white disabled:opacity-60"
          disabled={isSaving}
          onClick={saveAreas}
          type="button"
        >
          {m.common.save}
        </button>
      </div>

      {message ? <p className="text-xs font-bold text-slate-600">{message}</p> : null}

      <section className="space-y-2 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-pink-50/40 p-3.5 shadow-sm">
        <div>
          <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-crystal">
            1. Adım: Çocuğunuzun Kademesini Seçin
          </p>
          <p className="mt-0.5 text-xs font-bold text-slate-600">
            Sınıfa uygun okul derslerini ve branşları görmek için kademe seçin:
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {[
            { key: "preschool" as const, label: gradeLabels.preschool, icon: "🧸" },
            { key: "primary" as const, label: gradeLabels.primary, icon: "🎒" },
            { key: "middle" as const, label: gradeLabels.middle, icon: "📐" },
            { key: "high" as const, label: gradeLabels.high, icon: "🎓" },
            { key: "all" as const, label: "Tümü", icon: "🌟" },
          ].map((item) => {
            const isActive = gradeFilter === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setGradeFilter(item.key);
                  setShowOtherGrades(false);
                }}
                className={`tap-scale flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-crystal to-berry text-white shadow-sm scale-[1.02]"
                    : "border border-slate-200 bg-white text-slate-700 hover:border-crystal hover:bg-violet-50/50"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="space-y-5">
        {gradeFilter !== "all" ? (
          <>
            <div className="space-y-2">
              <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-indigo-600">
                📚 Branşlar ve Okul Dersleri ({matchingGradeAreas.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {matchingGradeAreas.length > 0 ? (
                  matchingGradeAreas.map((area) => {
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
                        {isSelected ? `✓ ${area.area_name}` : `+ ${area.area_name}`}
                      </button>
                    );
                  })
                ) : (
                  <p className="text-xs font-semibold text-slate-500">Bu kademeye özel branş bulunamadı, aşağıdan genel alanları seçebilirsiniz.</p>
                )}
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-200/80 pt-3">
              <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-purple-600">
                ✨ Diğer İlgi Alanları & Hobi ({generalHobbies.length})
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
                      {isSelected ? `✓ ${area.area_name}` : `+ ${area.area_name}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {otherGradeAreas.length > 0 ? (
              <div className="space-y-2 border-t border-slate-200/80 pt-3">
                <button
                  type="button"
                  onClick={() => setShowOtherGrades(!showOtherGrades)}
                  className="tap-scale flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-100/70 px-3.5 py-2 text-left text-xs font-black text-slate-700 hover:bg-slate-200/60"
                >
                  <span>🌍 Diğer Sınıfların Dersleri ({otherGradeAreas.length} Branş)</span>
                  <span className="font-bold text-crystal">{showOtherGrades ? "Gizle ▲" : "Göster ▼"}</span>
                </button>
                {showOtherGrades ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {otherGradeAreas.map((area) => {
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
                          {isSelected ? `✓ ${area.area_name}` : `+ ${area.area_name}`}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ) : null}
          </>
        ) : (
          groupedAreas.map((group) => (
            <div key={group.key}>
              <p className="mb-2 text-[0.65rem] font-black uppercase tracking-[0.14em] text-slate-500">
                {gradeLabels[group.key]}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.areas.map((area) => {
                  const isSelected = selectedAreaIds.has(area.id);
                  return (
                    <button
                      className={`tap-scale rounded-full border px-3 py-1.5 text-xs font-black ${
                        isSelected
                          ? "border-crystal bg-crystal text-white shadow-sm"
                          : "border-slate-200 bg-white text-night hover:border-crystal"
                      }`}
                      key={area.id}
                      onClick={() => toggleArea(area.id)}
                      type="button"
                    >
                      {isSelected ? `✓ ${area.area_name}` : `+ ${area.area_name}`}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {selectedAreaIds.size === 0 ? (
        <p className="text-xs font-bold text-amber-700">{c.selectArea}</p>
      ) : null}
    </div>
  );
}
