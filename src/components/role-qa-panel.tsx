"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  countAllRoleQaItems,
  countRoleQaItems,
  getRoleQaChecklists,
  getRoleQaRoles,
  type RoleQaRole,
} from "@/lib/domain/role-qa-checklist";
import { useMessages } from "@/lib/i18n/locale-context";

const storageKey = "zigo-role-qa-progress";

type StoredProgress = Partial<Record<RoleQaRole, string[]>>;

function readProgress(): StoredProgress {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as StoredProgress) : {};
  } catch {
    return {};
  }
}

function writeProgress(progress: StoredProgress) {
  window.localStorage.setItem(storageKey, JSON.stringify(progress));
}

export function RoleQaPanel() {
  const m = useMessages();
  const q = m.ops.roleQa;
  const c = m.ops.common;
  const roleQaRoles = useMemo(() => getRoleQaRoles(m), [m]);
  const roleQaChecklists = useMemo(() => getRoleQaChecklists(m), [m]);
  const [activeRole, setActiveRole] = useState<RoleQaRole>("student");
  const [progress, setProgress] = useState<StoredProgress>({});

  useEffect(() => {
    setProgress(readProgress());
  }, []);

  const sections = roleQaChecklists[activeRole];
  const roleChecked = progress[activeRole] ?? [];
  const roleTotal = countRoleQaItems(activeRole, roleQaChecklists);
  const roleDone = roleChecked.length;

  const overallDone = useMemo(
    () => roleQaRoles.reduce((total, role) => total + (progress[role.id]?.length ?? 0), 0),
    [progress, roleQaRoles],
  );
  const overallTotal = countAllRoleQaItems(
    roleQaChecklists,
    roleQaRoles.map((role) => role.id),
  );

  function toggleItem(itemId: string) {
    setProgress((current) => {
      const roleItems = new Set(current[activeRole] ?? []);
      if (roleItems.has(itemId)) roleItems.delete(itemId);
      else roleItems.add(itemId);

      const next = { ...current, [activeRole]: [...roleItems] };
      writeProgress(next);
      return next;
    });
  }

  function resetRole() {
    setProgress((current) => {
      const next = { ...current, [activeRole]: [] };
      writeProgress(next);
      return next;
    });
  }

  const activeRoleLabel = roleQaRoles.find((role) => role.id === activeRole)?.label ?? activeRole;

  return (
    <section className="-mx-4 bg-white px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-crystal">{q.eyebrow}</p>
          <h2 className="mt-1 text-xl font-black text-night">{q.title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">{q.desc}</p>
        </div>
        <div className="shrink-0 rounded-lg bg-slate-950 px-3 py-2 text-right text-white">
          <p className="text-sm font-black">{overallDone}/{overallTotal}</p>
          <p className="text-[0.62rem] font-bold text-slate-300">{c.totalChecks}</p>
        </div>
      </div>

      <div className="no-scrollbar mt-4 flex gap-1.5 overflow-x-auto">
        {roleQaRoles.map((role) => {
          const done = progress[role.id]?.length ?? 0;
          const total = countRoleQaItems(role.id, roleQaChecklists);
          const active = activeRole === role.id;

          return (
            <button
              className={`tap-scale shrink-0 rounded-full border px-3 py-1.5 text-xs font-black ${
                active ? "zigo-tab-active-pill" : "zigo-tab-inactive-pill"
              }`}
              key={role.id}
              onClick={() => setActiveRole(role.id)}
              type="button"
            >
              {role.label} {done}/{total}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
        <p className="text-sm font-black text-night">
          {q.progressLabel
            .replace("{role}", activeRoleLabel)
            .replace("{done}", String(roleDone))
            .replace("{total}", String(roleTotal))}
        </p>
        <button
          className="text-xs font-black text-crystal"
          onClick={resetRole}
          type="button"
        >
          {q.resetRole}
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {sections.map((section) => (
          <div key={section.title}>
            <h3 className="text-sm font-black text-night">{section.title}</h3>
            <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-100">
              {section.items.map((item) => {
                const checked = roleChecked.includes(item.id);
                return (
                  <li className="flex items-start gap-3 px-3 py-3" key={item.id}>
                    <input
                      checked={checked}
                      className="mt-1 size-4 rounded border-slate-300 text-crystal"
                      id={item.id}
                      onChange={() => toggleItem(item.id)}
                      type="checkbox"
                    />
                    <label className="min-w-0 flex-1 text-sm leading-6 text-slate-600" htmlFor={item.id}>
                      {item.text}
                      {item.href ? (
                        <>
                          {" "}
                          <Link className="font-black text-crystal" href={item.href}>
                            {c.open}
                          </Link>
                        </>
                      ) : null}
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <a
        className="mt-4 inline-flex rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-night"
        href="/manual-qa-checklist.md"
      >
        {q.fullMarkdown}
      </a>
    </section>
  );
}
