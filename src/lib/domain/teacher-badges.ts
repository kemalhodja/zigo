import { detectBranchKey } from "@/lib/domain/education-catalog";

const branchAccentClasses: Record<string, string> = {
  math: "bg-violet-50 text-violet-700 ring-violet-100",
  turkish: "bg-rose-50 text-rose-700 ring-rose-100",
  science: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  social: "bg-amber-50 text-amber-800 ring-amber-100",
  languages: "bg-sky-50 text-sky-700 ring-sky-100",
  coding: "bg-indigo-50 text-indigo-700 ring-indigo-100",
  lgsCoaching: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-100",
  yksCoaching: "bg-purple-50 text-purple-700 ring-purple-100",
  guidanceTeacher: "bg-teal-50 text-teal-700 ring-teal-100",
  scholarshipExam: "bg-orange-50 text-orange-700 ring-orange-100",
  studySkills: "bg-cyan-50 text-cyan-800 ring-cyan-100",
  homeworkCoaching: "bg-lime-50 text-lime-800 ring-lime-100",
  coaching: "bg-violet-50 text-violet-700 ring-violet-100",
};

const defaultBranchAccent = "bg-slate-100 text-slate-700 ring-slate-200";

export function branchAccentForArea(areaName: string) {
  const key = detectBranchKey(areaName);
  return key ? (branchAccentClasses[key] ?? defaultBranchAccent) : defaultBranchAccent;
}

export function uniqueBranches(branches: string[]) {
  return [...new Set(branches.map((branch) => branch.trim()).filter(Boolean))];
}
