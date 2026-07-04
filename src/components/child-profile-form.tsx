"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useMessages } from "@/lib/i18n/locale-context";

type Status = "idle" | "saving" | "saved" | "error";

export function ChildProfileForm() {
  const m = useMessages();
  const ed = m.education;
  const c = m.common;
  const f = ed.childAgeGroups;
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function submitChild(formData: FormData) {
    if (status === "saving") return;

    const displayName = String(formData.get("displayName") ?? "").trim();
    if (displayName.length < 2) {
      setStatus("error");
      setMessage(m.interest.selectOne);
      return;
    }

    setStatus("saving");
    setMessage(m.common.saving);

    try {
      const response = await fetch("/api/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          ageGroup: formData.get("ageGroup"),
        }),
      });

      if (response.ok) {
        setStatus("saved");
        setMessage(m.interest.saved);
        router.refresh();
        return;
      }

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setStatus("error");
      setMessage(payload?.error ?? m.interest.saveFailed);
    } catch {
      setStatus("error");
      setMessage(c.connectionFailed);
    }
  }

  return (
    <form action={submitChild} className="-mx-4 space-y-4 border-b border-pink-100 bg-white px-4 py-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">{m.education.classAndBranch}</p>
        <h2 className="mt-1 text-xl font-black text-night">{ed.createChildProfile}</h2>
        <p className="mt-1 text-sm font-bold leading-6 text-slate-500">{ed.createChildDesc}</p>
      </div>
      <div>
        <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{ed.childProfileName}</label>
        <input
          className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-night"
          name="displayName"
          placeholder={m.roles.student}
          required
        />
      </div>

      <div>
        <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{ed.filterByGrade}</label>
        <select
          className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-night"
          defaultValue=""
          name="ageGroup"
          required
        >
          <option disabled value="">
            {m.interest.selectArea}
          </option>
          <option value={f.preschool}>{f.preschool}</option>
          <option value={f.primaryLow}>{f.primaryLow}</option>
          <option value={f.primaryHigh}>{f.primaryHigh}</option>
          <option value={f.middle}>{f.middle}</option>
          <option value={f.high}>{f.high}</option>
        </select>
      </div>

      <button
        className="w-full rounded-lg bg-gradient-to-r from-crystal via-berry to-aqua px-4 py-3 text-sm font-black text-white disabled:opacity-60"
        disabled={status === "saving"}
        type="submit"
      >
        {status === "saving" ? c.saving : ed.createChildProfile}
      </button>

      {status === "saved" ? <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-600">{message}</p> : null}
      {status === "error" ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{message}</p>
      ) : null}
    </form>
  );
}
