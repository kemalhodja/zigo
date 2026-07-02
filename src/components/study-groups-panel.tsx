"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { StudyGroupRow } from "@/lib/domain/study-groups";
import { useMessages } from "@/lib/i18n/locale-context";

type StudyGroupsPanelProps = {
  groups: StudyGroupRow[];
  joinableGroups: StudyGroupRow[];
  role: "student" | "parent";
};

export function StudyGroupsPanel({ groups, joinableGroups, role }: StudyGroupsPanelProps) {
  const g = useMessages().studyGroups;
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function createGroup() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          parentEmail: role === "student" ? parentEmail : undefined,
        }),
      });
      const payload = (await response.json()) as { error?: string; data?: { status?: string } };

      if (!response.ok) {
        throw new Error(payload.error ?? g.createFailed);
      }

      setMessage(payload.data?.status === "pending_parent" ? g.createPending : g.createSuccess);
      setName("");
      setDescription("");
      setParentEmail("");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : g.createFailed);
    } finally {
      setLoading(false);
    }
  }

  async function requestJoin(groupId: string) {
    if (!parentEmail.trim()) {
      setMessage(g.parentEmailRequired);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/groups/${groupId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentEmail }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? g.joinFailed);
      }

      setMessage(g.joinPending);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : g.joinFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="-mx-4 border-b border-slate-100 bg-white px-4 pb-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-crystal">{g.eyebrow}</p>
        <h1 className="mt-1 text-2xl font-black text-night">{g.title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">{g.desc}</p>
      </section>

      <section className="-mx-4 bg-white px-4 py-4">
        <h2 className="text-lg font-black text-night">{g.createTitle}</h2>
        <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
          {role === "student" ? g.createStudentDesc : g.createParentDesc}
        </p>
        <div className="mt-3 space-y-2">
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold"
            onChange={(event) => setName(event.target.value)}
            placeholder={g.namePlaceholder}
            value={name}
          />
          <textarea
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold"
            onChange={(event) => setDescription(event.target.value)}
            placeholder={g.descriptionPlaceholder}
            rows={2}
            value={description}
          />
          {role === "student" ? (
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold"
              onChange={(event) => setParentEmail(event.target.value)}
              placeholder={g.parentEmailPlaceholder}
              type="email"
              value={parentEmail}
            />
          ) : null}
          <button
            className="tap-scale w-full rounded-lg bg-gradient-to-r from-crystal to-berry px-4 py-3 text-sm font-black text-white disabled:opacity-60"
            disabled={loading || name.trim().length < 2}
            onClick={() => void createGroup()}
            type="button"
          >
            {loading ? g.saving : g.createAction}
          </button>
        </div>
      </section>

      {role === "student" && joinableGroups.length > 0 ? (
        <section className="-mx-4 bg-white px-4 py-4">
          <h2 className="text-lg font-black text-night">{g.joinTitle}</h2>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{g.joinDesc}</p>
          <input
            className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold"
            onChange={(event) => setParentEmail(event.target.value)}
            placeholder={g.parentEmailPlaceholder}
            type="email"
            value={parentEmail}
          />
          <div className="mt-3 space-y-2">
            {joinableGroups.map((group) => (
              <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-3" key={group.id}>
                <div>
                  <p className="text-sm font-black text-night">{group.name}</p>
                  {group.description ? (
                    <p className="mt-1 text-xs font-bold text-slate-500">{group.description}</p>
                  ) : null}
                </div>
                <button
                  className="tap-scale rounded-lg bg-aqua px-3 py-2 text-xs font-black text-night disabled:opacity-60"
                  disabled={loading}
                  onClick={() => void requestJoin(group.id)}
                  type="button"
                >
                  {g.joinAction}
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="-mx-4 bg-white px-4 py-4">
        <h2 className="text-lg font-black text-night">{g.myGroupsTitle}</h2>
        {groups.length === 0 ? (
          <p className="mt-2 text-sm font-bold text-slate-500">{g.emptyGroups}</p>
        ) : (
          <div className="mt-3 space-y-2">
            {groups.map((group) => (
              <Link
                className="block rounded-lg border border-slate-100 px-3 py-3"
                href={group.status === "active" ? `/groups/${group.id}` : "#"}
                key={group.id}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-black text-night">{group.name}</p>
                  <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[0.65rem] font-black uppercase text-slate-600">
                    {group.status === "pending_parent" ? g.statusPending : group.status === "active" ? g.statusActive : g.statusClosed}
                  </span>
                </div>
                {group.status === "active" ? (
                  <p className="mt-1 text-xs font-bold text-crystal">{g.openChat}</p>
                ) : null}
              </Link>
            ))}
          </div>
        )}
      </section>

      {message ? <p className="px-4 text-sm font-bold text-crystal">{message}</p> : null}
    </div>
  );
}
