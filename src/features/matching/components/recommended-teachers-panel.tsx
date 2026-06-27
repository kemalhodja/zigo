"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ChildOption = { id: string; name: string };

type RecommendedTeacher = {
  teacher_id: string;
  full_name: string;
  reputation_score: number;
  area_name: string;
  match_score: number;
  weakness_level: number;
};

type RecommendedTeachersPanelProps = {
  childProfileId?: string;
  childrenOptions?: ChildOption[];
  role: "parent" | "student";
  labels: {
    eyebrow: string;
    title: string;
    desc: string;
    weaknessPrefix: string;
    reputation: string;
    empty: string;
    requestLesson: string;
    analyzing: string;
    childLabel: string;
  };
};

export function RecommendedTeachersPanel({
  childProfileId,
  childrenOptions = [],
  role,
  labels,
}: RecommendedTeachersPanelProps) {
  const [selectedChildId, setSelectedChildId] = useState(childProfileId ?? childrenOptions[0]?.id ?? "");
  const [weaknesses, setWeaknesses] = useState<Array<{ areaName: string; averageScore: number }>>([]);
  const [teachers, setTeachers] = useState<RecommendedTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const activeChildId = selectedChildId || childrenOptions[0]?.id || "";
    if (role === "parent" && !activeChildId) {
      setTeachers([]);
      setWeaknesses([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadRecommendations() {
      setLoading(true);
      setMessage(labels.analyzing);

      try {
        const params = new URLSearchParams({ limit: "5", autoAnalyze: "true" });
        if (role === "parent" && activeChildId) {
          params.set("childProfileId", activeChildId);
        }

        const response = await fetch(`/api/ecosystem/matching/recommendations?${params.toString()}`);
        const payload = (await response.json()) as {
          data?: {
            weaknesses?: Array<{ areaName: string; averageScore: number }>;
            teachers?: RecommendedTeacher[];
          };
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? labels.empty);
        }

        if (cancelled) return;

        setWeaknesses(payload.data?.weaknesses ?? []);
        setTeachers(payload.data?.teachers ?? []);
        setMessage("");
      } catch (error) {
        if (cancelled) return;
        setTeachers([]);
        setWeaknesses([]);
        setMessage(error instanceof Error ? error.message : labels.empty);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadRecommendations();

    return () => {
      cancelled = true;
    };
  }, [childrenOptions, labels.analyzing, labels.empty, role, selectedChildId]);

  return (
    <section className="-mx-4 border-y border-violet-100 bg-white px-4 py-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">{labels.eyebrow}</p>
      <h2 className="mt-2 text-lg font-black text-night">{labels.title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">{labels.desc}</p>

      {role === "parent" && childrenOptions.length > 1 ? (
        <label className="mt-4 block">
          <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{labels.childLabel}</span>
          <select
            className="mt-2 w-full rounded-lg border border-violet-100 bg-violet-50 px-3 py-2 text-sm font-semibold text-night"
            onChange={(event) => setSelectedChildId(event.target.value)}
            value={selectedChildId}
          >
            {childrenOptions.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {weaknesses.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {weaknesses.map((weakness) => (
            <span
              className="rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-rose-700"
              key={`${weakness.areaName}-${weakness.averageScore}`}
            >
              {labels.weaknessPrefix.replace("{area}", weakness.areaName).replace(
                "{score}",
                String(weakness.averageScore),
              )}
            </span>
          ))}
        </div>
      ) : null}

      {loading ? (
        <p className="mt-4 text-sm font-semibold text-slate-500">{message || labels.analyzing}</p>
      ) : teachers.length === 0 ? (
        <p className="mt-4 text-sm font-semibold text-slate-500">{message || labels.empty}</p>
      ) : (
        <div className="mt-4 space-y-2">
          {teachers.map((teacher) => (
            <article
              className="rounded-xl border border-violet-100 bg-gradient-to-r from-violet-50 to-white px-4 py-3"
              key={teacher.teacher_id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-night">{teacher.full_name}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{teacher.area_name}</p>
                  <p className="mt-1 text-xs font-bold text-crystal">
                    {labels.reputation}: {teacher.reputation_score}
                  </p>
                </div>
                <Link
                  className="zigo-touch-btn shrink-0 rounded-xl bg-gradient-to-r from-crystal to-berry px-4 text-white"
                  href={role === "parent" ? "/parent/requests" : "/learn"}
                >
                  {labels.requestLesson}
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
