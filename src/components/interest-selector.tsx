"use client";

import Link from "next/link";
import { markRegistrationCampaignAnnouncementPending } from "@/lib/client/registration-campaign-announcement";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

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
};

export function InterestSelector({
  areas,
  initialSelectedAreaIds,
  initialOrganizationType = null,
  role,
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
  const groupedAreas = useMemo(() => groupEducationAreasByGrade(visibleAreas), [visibleAreas]);
  const isTeacherNiche = role === "teacher";
  const maxSelections = isTeacherNiche ? 1 : 20;
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

  function toggleArea(areaId: number) {
    if (status !== "saving") {
      setStatus("idle");
      setMessage("");
    }

    setSelectedAreaIds((current) => {
      if (isTeacherNiche) {
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

      <div className="space-y-5">
        {groupedAreas.map((group) => (
          <section className="space-y-2" key={group.key}>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              {gradeLabels[group.key as GradeCategoryKey]}
            </p>
            <div className="grid gap-2">
              {group.areas.map((area) => {
                const isSelected = selectedAreaIds.has(area.id);
                const gradeKey = isGeneralInterestArea(area)
                  ? "generalInterest"
                  : resolveGradeCategory(area.age_group);

                return (
                  <button
                    className={`tap-scale rounded-lg border p-4 text-left transition disabled:opacity-60 ${
                      isSelected ? "border-crystal bg-violet-50" : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                    disabled={status === "saving"}
                    key={area.id}
                    onClick={() => toggleArea(area.id)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-night">{area.area_name}</p>
                        <p className="mt-1 text-sm text-slate-500">{gradeLabels[gradeKey]}</p>
                      </div>
                      <span
                        className={`rounded-lg px-3 py-1 text-xs font-black ${
                          isSelected ? "bg-crystal text-white" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {isSelected ? f.selected : f.add}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
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
