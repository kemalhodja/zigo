"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { markRegistrationCampaignAnnouncementPending } from "@/lib/client/registration-campaign-announcement";
import type { GradeCategoryKey } from "@/lib/domain/education-catalog";
import { groupEducationAreasByGrade, resolveGradeCategory } from "@/lib/domain/education-catalog";
import {
  type EducationOrganizationType,
  getOrganizationOption,
} from "@/lib/domain/education-organization";
import {
  filterAreasForInterestSelection,
  isGeneralInterestArea,
} from "@/lib/domain/general-interest-areas";
import { isOrganizationRegistrationType } from "@/lib/domain/registration-account";
import { useMessages } from "@/lib/i18n/locale-context";
import type { Database, UserRole } from "@/lib/supabase/database.types";

type EducationArea = Database["public"]["Tables"]["education_areas"]["Row"];
type Status = "idle" | "saving" | "saved" | "error";

type InterestSelectorProps = {
  areas: EducationArea[];
  initialSelectedAreaIds: number[];
  initialOrganizationType?: EducationOrganizationType | null;
  role: UserRole;
  multiple?: boolean;
};

export function InterestSelector({
  areas,
  initialSelectedAreaIds,
  initialOrganizationType = null,
  role,
  multiple = false,
}: InterestSelectorProps) {
  const m = useMessages();
  const f = m.forms;
  const i = m.interest;
  const router = useRouter();
  const [selectedAreaIds, setSelectedAreaIds] = useState(() => new Set(initialSelectedAreaIds));
  const [organizationType] = useState<EducationOrganizationType | null>(
    initialOrganizationType,
  );
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [gradeFilter, setGradeFilter] = useState<GradeCategoryKey | "all">(() => {
    if (role === "teacher") return "generalInterest";
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
    if (role === "parent") return "parent";
    return "middle";
  });
  const [showOtherGrades, setShowOtherGrades] = useState(false);

  const selectedCount = selectedAreaIds.size;
  const selectedList = useMemo(() => [...selectedAreaIds], [selectedAreaIds]);
  const visibleAreas = useMemo(
    () => filterAreasForInterestSelection(areas, role),
    [areas, role],
  );
  const groupedAreas = useMemo(() => groupEducationAreasByGrade(visibleAreas), [visibleAreas]);
  const { matchingGradeAreas, generalHobbies, otherGradeAreas } = useMemo(() => {
    const matching: EducationArea[] = [];
    const hobbies: EducationArea[] = [];
    const others: EducationArea[] = [];

    for (const area of visibleAreas) {
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
  }, [visibleAreas, gradeFilter]);
  const isTeacherNiche = role === "teacher";
  const maxSelections = multiple ? 20 : isTeacherNiche ? 1 : 20;
  const lockedRegistrationOrg = isOrganizationRegistrationType(initialOrganizationType);
  const registrationOrgLabel = getOrganizationOption(initialOrganizationType)?.label;
  const gradeLabels = m.education.gradeCategories;
  const nextStep =
    lockedRegistrationOrg
      ? { href: "/profile", label: "Kurumsal abonelik" }
      : role === "teacher"
      ? { href: "/teacher", label: i.openStudio }
      : role === "parent"
        ? { href: "/parent", label: i.openParent }
        : { href: "/", label: i.continueFeed };

  function cleanAreaName(name: string) {
    return name
      .replace(/^(1-4\.\s*Sınıf|5-8\.\s*Sınıf|9-12\.\s*Sınıf|Okul Öncesi|LGS|YKS|TYT|AYT)\s*/i, "")
      .trim();
  }

  function renderAreaButtons(areaList: EducationArea[]) {
    return (
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {areaList.map((area) => {
          const isSelected = selectedAreaIds.has(area.id);
          const gradeKey = isGeneralInterestArea(area)
            ? "generalInterest"
            : resolveGradeCategory(area.age_group);
          const displayName = cleanAreaName(area.area_name);

          return (
            <button
              className={`tap-scale rounded-xl border p-3.5 text-left transition disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-crystal focus:ring-offset-2 ${
                isSelected ? "border-crystal bg-violet-50/90 ring-1 ring-crystal/30 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"
              }`}
              disabled={status === "saving"}
              key={area.id}
              onClick={() => toggleArea(area.id)}
              type="button"
              aria-pressed={isSelected}
              aria-label={`${displayName} - ${gradeLabels[gradeKey]}${isSelected ? ` (${f.selected})` : ` (${f.add})`}`}
              role="listitem"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-night">{displayName}</p>
                </div>
                <span
                  className={`rounded-lg px-2.5 py-1 text-xs font-black shrink-0 ${
                    isSelected ? "bg-gradient-to-r from-crystal to-berry text-white shadow-sm" : "bg-slate-100 text-slate-600"
                  }`}
                  aria-hidden="true"
                >
                  {isSelected ? `✓ ${f.selected}` : `+ ${f.add}`}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  function toggleArea(areaId: number) {
    if (status !== "saving") {
      setStatus("idle");
      setMessage("");
    }

    setSelectedAreaIds((current) => {
      if (!multiple && isTeacherNiche) {
        return current.has(areaId) ? new Set<number>() : new Set([areaId]);
      }

      const next = new Set(current);

      if (next.has(areaId)) {
        next.delete(areaId);
      } else if (next.size < maxSelections) {
        next.add(areaId);
      }

      return next;
    });
  }

  async function saveInterests() {
    if (selectedList.length === 0) {
      setStatus("error");
      setMessage(i.selectOne);
      return;
    }

    if (isTeacherNiche && selectedList.length !== 1) {
      setStatus("error");
      setMessage(i.teacherPickOneGeneral);
      return;
    }

    setStatus("saving");
    setMessage(i.saving);

    try {
      const response = await fetch("/api/interests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          areaIds: selectedList,
          ...(organizationType && !lockedRegistrationOrg ? { organizationType } : {}),
        }),
      });

      if (response.ok) {
        setStatus("saved");
        setMessage(i.saved);
        markRegistrationCampaignAnnouncementPending();
        router.refresh();
        return;
      }

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setStatus("error");
      setMessage(payload?.error ?? i.saveFailed);
    } catch {
      setStatus("error");
      setMessage(i.connectionFailed);
    }
  }

  return (
    <div className="-mx-4 space-y-5 bg-white px-4 py-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-crystal">{f.matchFeedSetup}</p>
          <h3 className="mt-2 text-xl font-black text-night">
            {selectedCount} {i.selectedCount}
          </h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {isTeacherNiche ? i.teacherPickOneGeneral : i.chooseOne}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-400">
            {isTeacherNiche ? i.teacherGeneralHint : i.groupedByGrade}
          </p>
        </div>
        <button
          className="tap-scale zigo-cta tap-scale rounded-lg px-4 py-3 text-sm font-black text-white disabled:opacity-60"
          disabled={status === "saving" || selectedCount === 0}
          onClick={saveInterests}
          type="button"
        >
          {status === "saving" ? m.common.saving : selectedCount > 0 ? f.saveContinue : i.selectArea}
        </button>
      </div>

      {status === "saving" ? (
        <p className="rounded-lg bg-violet-50 px-4 py-3 text-sm font-bold text-crystal">
          {message}
        </p>
      ) : null}

      {lockedRegistrationOrg && registrationOrgLabel ? (
        <section className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-700">Kayıt türü</p>
          <p className="mt-1 text-sm font-black text-night">{registrationOrgLabel}</p>
        </section>
      ) : null}

      {!isTeacherNiche ? (
        <section className="space-y-2.5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-pink-50/40 p-4 shadow-sm">
          <div>
            <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-crystal">
              1. Adım: Sınıf / Kademe Seçin
            </p>
            <p className="mt-0.5 text-xs font-bold text-slate-600">
              Önce sınıfınıza uygun branşları ve dersleri görmek için kademenizi belirleyin:
            </p>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {[
              { key: "primary" as const, label: gradeLabels.primary, icon: "🎒" },
              { key: "middle" as const, label: gradeLabels.middle, icon: "📐" },
              { key: "high" as const, label: gradeLabels.high, icon: "🎓" },
              { key: "preschool" as const, label: gradeLabels.preschool, icon: "🧸" },
              { key: "parent" as const, label: gradeLabels.parent, icon: "👨‍👩‍👧" },
              { key: "all" as const, label: "Tümü (Tüm Branşlar)", icon: "🌟" },
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
                  className={`tap-scale flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-crystal to-berry text-white shadow-md shadow-crystal/25 scale-[1.02]"
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
      ) : null}

      <div className="space-y-6" role="group" aria-label={i.chooseOne}>
        {!isTeacherNiche && gradeFilter !== "all" ? (
          <>
            <section className="space-y-2.5">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div>
                  <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-indigo-600">
                    2. Adım: Branş & Akademik Dersler
                  </p>
                  <h4 className="text-base font-black text-night">
                    📚 Branşlar ({matchingGradeAreas.length} Alan)
                  </h4>
                </div>
              </div>
              {matchingGradeAreas.length > 0 ? (
                renderAreaButtons(matchingGradeAreas)
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                  <p className="text-xs font-bold text-slate-600">
                    Bu kademeye özel doğrudan branş tanımı bulunmuyor. Aşağıdan genel ilgi alanlarına veya diğer kademe derslerine göz atabilirsiniz.
                  </p>
                </div>
              )}
            </section>

            <section className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div>
                  <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-purple-600">
                    3. Adım: İsteğe Bağlı İlgi Alanları
                  </p>
                  <h4 className="text-base font-black text-night">
                    ✨ Diğer İlgi Alanları & Hobi ({generalHobbies.length} Alan)
                  </h4>
                  <p className="text-xs font-semibold text-slate-500">
                    Sınıf branşlarınıza ek olarak teknoloji, sanat, spor veya yaşam alanlarını da listenize ekleyebilirsiniz.
                  </p>
                </div>
              </div>
              {renderAreaButtons(generalHobbies)}
            </section>

            {otherGradeAreas.length > 0 ? (
              <section className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOtherGrades(!showOtherGrades)}
                  className="tap-scale flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-left text-xs font-black text-slate-700 transition hover:bg-slate-100"
                >
                  <span>🌍 Diğer Kademe / Sınıfların Dersleri ({otherGradeAreas.length} Alan)</span>
                  <span className="font-bold text-crystal">{showOtherGrades ? "Gizle ▲" : "Göster ▼"}</span>
                </button>
                {showOtherGrades ? (
                  <div className="pt-2">{renderAreaButtons(otherGradeAreas)}</div>
                ) : null}
              </section>
            ) : null}
          </>
        ) : (
          groupedAreas.map((group) => (
            <section className="space-y-2.5" key={group.key}>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500" id={`group-${group.key}`}>
                {gradeLabels[group.key as GradeCategoryKey]}
              </p>
              <div role="list" aria-labelledby={`group-${group.key}`}>
                {renderAreaButtons(group.areas)}
              </div>
            </section>
          ))
        )}
      </div>

      {status === "saved" ? (
        <div className="space-y-3 rounded-lg bg-emerald-50 px-4 py-3">
          <p className="text-sm font-bold text-emerald-600">
            {message}
          </p>
          <Link className="tap-scale block zigo-cta tap-scale rounded-lg px-4 py-3 text-center text-sm font-black text-white" href={nextStep.href}>
            {nextStep.label}
          </Link>
        </div>
      ) : null}
      {status === "error" ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
          {message}
        </p>
      ) : null}
    </div>
  );
}
