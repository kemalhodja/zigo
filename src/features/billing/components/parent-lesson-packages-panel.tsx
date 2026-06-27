"use client";

import { useState } from "react";

import type { LessonPackageAccess } from "@/lib/domain/lesson-packages/subscription";
import {
  LESSON_PACKAGE_PLANS,
  type LessonPackagePlanId,
} from "@/lib/domain/lesson-packages/plans";
import { useMessages } from "@/lib/i18n/locale-context";

type ParentLessonPackagesPanelProps = {
  initialAccess: LessonPackageAccess;
  allowDevActivate?: boolean;
};

export function ParentLessonPackagesPanel({
  initialAccess,
  allowDevActivate = false,
}: ParentLessonPackagesPanelProps) {
  const m = useMessages();
  const lp = m.lessonPackages;
  const [access, setAccess] = useState(initialAccess);
  const [busyPlan, setBusyPlan] = useState<LessonPackagePlanId | null>(null);
  const [message, setMessage] = useState("");

  async function purchase(planId: LessonPackagePlanId) {
    setBusyPlan(planId);
    setMessage("");

    try {
      const response = await fetch("/api/billing/lesson-packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const payload = (await response.json()) as {
        data?: { mode?: string; url?: string; subscription?: LessonPackageAccess };
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? lp.checkoutFailed);
      }

      if (payload.data?.mode === "dev") {
        setMessage(lp.devActivated);
        const statusRes = await fetch("/api/billing/lesson-packages");
        const statusPayload = (await statusRes.json()) as { data?: LessonPackageAccess };
        if (statusPayload.data) setAccess(statusPayload.data);
        return;
      }

      if (payload.data?.url) {
        window.location.href = payload.data.url;
        return;
      }

      throw new Error(lp.checkoutFailed);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : lp.checkoutFailed);
    } finally {
      setBusyPlan(null);
    }
  }

  return (
    <section className="-mx-4 space-y-4 bg-gradient-to-br from-slate-950 via-violet-950 to-slate-900 px-4 py-5 text-white">
      <div>
        <p className="zigo-eyebrow text-amber-300">{lp.eyebrow}</p>
        <h1 className="zigo-display mt-2 font-black text-white">{lp.title}</h1>
        <p className="mt-2 text-base font-semibold text-white/75">{lp.desc}</p>
      </div>

      {access.hasAccess ? (
        <div className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 p-4">
          <p className="text-base font-black text-emerald-100">{lp.activeTitle}</p>
          <p className="mt-1 text-sm font-semibold text-emerald-50/90">
            {access.planType === "zigo_plus"
              ? lp.activeZigoPlus
              : lp.activePackage
                  .replace("{plan}", String(access.planType ?? ""))
                  .replace("{remaining}", String(access.lessonsRemaining ?? 0))}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4">
          <p className="text-base font-black text-amber-100">{lp.expiredTitle}</p>
          <p className="mt-1 text-sm font-semibold text-amber-50/90">{lp.expiredDesc}</p>
        </div>
      )}

      <div className="zigo-dashboard-grid">
        {LESSON_PACKAGE_PLANS.map((plan) => (
          <article className="zigo-mobile-card rounded-2xl bg-white/95 text-night" key={plan.id}>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-crystal">{plan.name}</p>
            <p className="mt-2 text-3xl font-black">{plan.priceTry} ₺</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {lp.lessonsPerMonth.replace("{n}", String(plan.lessonsIncluded))}
            </p>
            <ul className="mt-4 space-y-2">
              {plan.highlights.map((item) => (
                <li className="text-sm font-semibold text-slate-600" key={item}>
                  • {item}
                </li>
              ))}
            </ul>
            <button
              className="zigo-mobile-cta tap-scale mt-5 w-full rounded-2xl disabled:opacity-60"
              disabled={busyPlan !== null}
              onClick={() => void purchase(plan.id)}
              type="button"
            >
              {busyPlan === plan.id ? "…" : lp.buyPackage}
            </button>
          </article>
        ))}
      </div>

      {allowDevActivate ? (
        <p className="text-xs font-semibold text-white/60">{lp.devNote}</p>
      ) : null}
      {message ? <p className="text-sm font-bold text-amber-200">{message}</p> : null}
    </section>
  );
}
