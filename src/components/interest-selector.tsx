"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { markRegistrationCampaignAnnouncementPending } from "@/lib/client/registration-campaign-announcement";
import type { GradeCategoryKey } from "@/lib/domain/education-catalog";
import {
  displayEducationAreaName,
  groupEducationAreasByGrade,
} from "@/lib/domain/education-catalog";
import {
  type EducationOrganizationType,
  getOrganizationOption,
} from "@/lib/domain/education-organization";
import {
  filterAreasForInterestSelection,
  isGeneralInterestArea,
} from "@/lib/domain/general-interest-areas";
import {
  filterAreasForGradeLevel,
  isAutoInterestGradeLevel,
  requiresBranchSelection,
} from "@/lib/domain/grade-level";
import { filterAreasForLaunchScopedSelection } from "@/lib/domain/launch-scope";
import { isOrganizationRegistrationType } from "@/lib/domain/registration-account";
import { useMessages } from "@/lib/i18n/locale-context";
import type { Database, UserRole } from "@/lib/supabase/database.types";

type EducationArea = Database["public"]["Tables"]["education_areas"]["Row"];
type Status = "idle" | "saving" | "saved" | "error";

type InterestSelectorProps = {
  areas: EducationArea[];
  initialSelectedAreaIds: number[];
  initialOrganizationType?: EducationOrganizationType | null;
  gradeLevel?: string | null;
  role: UserRole;
  multiple?: boolean;
};

export function InterestSelector({
  areas,
  initialSelectedAreaIds,
  initialOrganizationType = null,
  gradeLevel = null,
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

  const selectedCount = selectedAreaIds.size;
  const selectedList = useMemo(() => [...selectedAreaIds], [selectedAreaIds]);
  const visibleAreas = useMemo(
    () => filterAreasForInterestSelection(areas, role),
    [areas, role],
  );
  const isTeacherNiche = role === "teacher";
  const isLearner = role === "student" || role === "parent";
  const autoGrade = isLearner && isAutoInterestGradeLevel(gradeLevel);
  const needsBranchPick = isLearner && requiresBranchSelection(gradeLevel);
  const gradeScopedAreas = useMemo(() => {
    if (!isLearner || !gradeLevel) {
      return isLearner ? filterAreasForLaunchScopedSelection(visibleAreas, gradeLevel) : visibleAreas;
    }
    return filterAreasForLaunchScopedSelection(
      filterAreasForGradeLevel(visibleAreas, gradeLevel),
      gradeLevel,
    );
  }, [visibleAreas, gradeLevel, isLearner]);
  const generalHobbies = useMemo(
    () =>
      filterAreasForLaunchScopedSelection(visibleAreas, gradeLevel).filter((area) =>
        isGeneralInterestArea(area),
      ),
    [visibleAreas, gradeLevel],
  );
  const groupedAreas = useMemo(
    () =>
      groupEducationAreasByGrade(
        isLearner ? filterAreasForLaunchScopedSelection(visibleAreas, gradeLevel) : visibleAreas,
      ),
    [visibleAreas, gradeLevel, isLearner],
  );
  const maxSelections = 50;
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

  function renderAreaButtons(areaList: EducationArea[]) {
    const uniqueAreas = Array.from(
      new Map(areaList.map((item) => [displayEducationAreaName(item.area_name), item])).values()
    );

    return (
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {uniqueAreas.map((area) => {
          const isSelected = selectedAreaIds.has(area.id);
          const displayName = displayEducationAreaName(area.area_name);

          return (
            <button
              className={`tap-scale rounded-xl border p-3.5 text-left transition disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-crystal focus:ring-offset-2 ${
                isSelected ? "border-crystal bg-violet-50/90 ring-1 ring-crystal/30 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"
              }`}
              disabled={status === "saving" || autoGrade}
              key={area.id}
              onClick={() => toggleArea(area.id)}
              type="button"
              aria-pressed={isSelected}
              aria-label={`${displayName}${isSelected ? ` (${f.selected})` : ` (${f.add})`}`}
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
    if (autoGrade) return;
    if (status !== "saving") {
      setStatus("idle");
      setMessage("");
    }

    setSelectedAreaIds((current) => {
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
    if (autoGrade) {
      setStatus("saved");
      setMessage("1-8. sınıflarda dersler sınıf seçimine göre otomatik atanır.");
      return;
    }

    if (selectedList.length === 0) {
      setStatus("error");
      setMessage(i.selectOne);
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

  if (isLearner && !gradeLevel) {
    return (
      <div className="-mx-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm font-bold text-amber-800">
        Önce yukarıdan sınıf veya sınav kademesini seçin. 1-8. sınıflarda dersler otomatik atanır;
        9-12 ve YKS/TYT/AYT/DGS/ALES/KPSS için branş seçimi açılır.
      </div>
    );
  }

  if (autoGrade) {
    return (
      <div className="-mx-4 space-y-4 bg-white px-4 py-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
            Otomatik ders seçimi
          </p>
          <p className="mt-1 text-sm font-bold text-emerald-800">
            {gradeLevel} için tüm dersler otomatik seçildi ({selectedCount} alan). Branş seçmenize gerek yok.
          </p>
        </div>
        {selectedCount > 0 ? renderAreaButtons(gradeScopedAreas.filter((area) => selectedAreaIds.has(area.id))) : null}
        <Link className="tap-scale block zigo-cta rounded-lg px-4 py-3 text-center text-sm font-black text-white" href={nextStep.href}>
          {nextStep.label}
        </Link>
      </div>
    );
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
            {needsBranchPick
              ? `${gradeLevel} için branş seçin`
              : "İlgi alanlarınızı seçin (Keşfet akışınız bu alanlara göre kişiselleştirilir)"}
          </p>
          {isLearner ? (
            <p className="mt-2 text-xs font-bold leading-5 text-crystal">{i.launchFreezeHint}</p>
          ) : null}
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

      <div className="space-y-6" role="group" aria-label={i.chooseOne}>
        {isLearner && needsBranchPick ? (
          <>
            <section className="space-y-2.5">
              <div className="border-b border-slate-100 pb-2">
                <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-indigo-600">
                  Branş seçimi
                </p>
                <h4 className="text-base font-black text-night">
                  {gradeLevel} alanları ({gradeScopedAreas.length})
                </h4>
              </div>
              {gradeScopedAreas.length > 0 ? (
                renderAreaButtons(gradeScopedAreas)
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                  <p className="text-xs font-bold text-slate-600">
                    Bu kademe için henüz branş tanımlı değil.
                  </p>
                </div>
              )}
            </section>
            {generalHobbies.length > 0 ? (
              <section className="space-y-2.5 pt-2">
                <div className="border-b border-slate-100 pb-2">
                  <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-purple-600">
                    İsteğe bağlı ilgi alanları
                  </p>
                </div>
                {renderAreaButtons(generalHobbies)}
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
