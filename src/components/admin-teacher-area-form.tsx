"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { useMessages } from "@/lib/i18n/locale-context";

type Area = {
  id: number;
  area_name: string;
  age_group: string | null;
};

type AdminTeacherAreaFormProps = {
  areas: Area[];
  teacherId: string;
};

export function AdminTeacherAreaForm({ areas, teacherId }: AdminTeacherAreaFormProps) {
  const { ops: { admin: a, common: c } } = useMessages();
  const router = useRouter();
  const [selectedAreaIds, setSelectedAreaIds] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const selectedLabel = useMemo(
    () => `${selectedAreaIds.length} ${c.selected}`,
    [c.selected, selectedAreaIds.length],
  );

  function applyYksPreset() {
    const yksAreaIds = areas
      .filter((area) => /yks|lgs|deneme|koçluk|koçluğu/i.test(area.area_name))
      .map((area) => area.id);
    if (yksAreaIds.length === 0) return;
    setSelectedAreaIds(yksAreaIds);
    setMessage(a.yksPresetApplied);
  }

  function toggleArea(areaId: number) {
    setSelectedAreaIds((current) =>
      current.includes(areaId)
        ? current.filter((id) => id !== areaId)
        : [...current, areaId],
    );
  }

  async function saveAreas() {
    if (isSaving || selectedAreaIds.length === 0) return;

    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/teachers/areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId, areaIds: selectedAreaIds }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setMessage(payload?.error ?? a.areasSaveFailed);
        return;
      }

      setMessage(a.areasSaved);
      router.refresh();
    } catch {
      setMessage(c.connectionFailed);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-2 rounded-lg bg-slate-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{a.areasEyebrow}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{a.areasDesc}</p>
        </div>
        <span className="shrink-0 rounded-lg bg-white px-2 py-1 text-[0.65rem] font-black text-night">
          {selectedLabel}
        </span>
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {areas.map((area) => {
          const isSelected = selectedAreaIds.includes(area.id);
          const isYks = /yks|lgs|deneme|koçluk|koçluğu/i.test(area.area_name);
          return (
            <button
              className={`tap-scale shrink-0 rounded-lg border px-3 py-2 text-xs font-black ${
                isSelected
                  ? "border-transparent bg-gradient-to-r from-crystal to-berry text-white"
                  : isYks
                    ? "border-violet-200 bg-violet-50 text-crystal"
                    : "border-pink-100 bg-white text-slate-600"
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
      <div className="flex flex-wrap gap-2">
        <button
          className="rounded-lg bg-violet-100 px-3 py-2 text-xs font-black text-crystal"
          onClick={applyYksPreset}
          type="button"
        >
          {a.yksPreset}
        </button>
        <button
          className="tap-scale zigo-cta tap-scale rounded-lg px-3 py-2 text-xs font-black text-white disabled:opacity-50"
          disabled={isSaving || selectedAreaIds.length === 0}
          onClick={saveAreas}
          type="button"
        >
          {isSaving ? c.saving : a.saveAreas}
        </button>
      </div>
      {message ? <p className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-600">{message}</p> : null}
    </div>
  );
}
