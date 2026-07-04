"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { groupEducationAreasByGrade } from "@/lib/domain/education-catalog";
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
  const groupedAreas = useMemo(() => groupEducationAreasByGrade(areas), [areas]);

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

      <div className="space-y-4">
        {groupedAreas.map((group) => (
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
                        ? "border-crystal bg-crystal/10 text-crystal"
                        : "border-slate-200 bg-white text-night"
                    }`}
                    key={area.id}
                    onClick={() => toggleArea(area.id)}
                    type="button"
                  >
                    {area.area_name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {selectedAreaIds.size === 0 ? (
        <p className="text-xs font-bold text-amber-700">{c.selectArea}</p>
      ) : null}
    </div>
  );
}
