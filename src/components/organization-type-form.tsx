"use client";

import { useState } from "react";

import {
  EDUCATION_ORGANIZATION_OPTIONS,
  type EducationOrganizationType,
} from "@/lib/domain/education-organization";
import { formatTryPrice, resolveOrganizationPlanGroups } from "@/lib/domain/subscription-plans";

type OrganizationTypeFormProps = {
  initialOrganizationType?: EducationOrganizationType | null;
};

export function OrganizationTypeForm({ initialOrganizationType = null }: OrganizationTypeFormProps) {
  const [organizationType, setOrganizationType] = useState<EducationOrganizationType | null>(
    initialOrganizationType,
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const organizationPlans = resolveOrganizationPlanGroups(organizationType);
  const yearlyPlan = organizationPlans[0]?.plans.find((item) => item.interval === "yearly");

  async function saveOrganizationType(nextType: EducationOrganizationType) {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/profile/organization-type", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationType: nextType }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setMessage(payload?.error ?? "Kurum türü kaydedilemedi.");
        setLoading(false);
        return;
      }

      setOrganizationType(nextType);
      setMessage("Kurum türü kaydedildi. Kurumsal abonelik planları profilinizde görünür.");
      setLoading(false);
    } catch {
      setMessage("Bağlantı hatası.");
      setLoading(false);
    }
  }

  return (
    <section className="-mx-4 border-t border-slate-100 bg-white px-4 py-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Kurum türü</p>
      <h2 className="mt-1 text-lg font-black text-night">Branşlarınızın yanında kurum tipi</h2>
      <p className="mt-1 text-sm font-semibold text-slate-500">
        Kurs, okul, eğitim kurumu veya eğitim platformu seçerek kurumsal abonelik fiyatını görün.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {EDUCATION_ORGANIZATION_OPTIONS.map((option) => {
          const isSelected = organizationType === option.id;
          return (
            <button
              className={`rounded-lg border p-3 text-left transition disabled:opacity-60 ${
                isSelected ? "border-crystal bg-violet-50" : "border-slate-200 bg-slate-50 hover:border-slate-300"
              }`}
              disabled={loading}
              key={option.id}
              onClick={() => void saveOrganizationType(option.id)}
              type="button"
            >
              <p className="text-sm font-black text-night">{option.label}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">{option.description}</p>
            </button>
          );
        })}
      </div>

      {yearlyPlan ? (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">
          {organizationPlans[0]?.title}: yıllık{" "}
          <span className="line-through opacity-60">{formatTryPrice(yearlyPlan.compareAtTry)}</span>{" "}
          {formatTryPrice(yearlyPlan.priceTry)}
        </p>
      ) : null}

      {message ? <p className="mt-3 text-sm font-bold text-emerald-700">{message}</p> : null}
    </section>
  );
}
