export type ExamGoalType = "lgs" | "yks" | "general";

export type ExamCountdown = {
  examType: ExamGoalType;
  label: string;
  examDate: string;
  daysRemaining: number;
  hoursRemaining: number;
};

/** Official-style exam windows — update annually. */
const EXAM_DATES: Record<Exclude<ExamGoalType, "general">, { label: string; date: string }> = {
  lgs: { label: "LGS 2026", date: "2026-06-07" },
  yks: { label: "YKS 2026 (TYT)", date: "2026-06-20" },
};

export function getExamCountdown(goal: ExamGoalType): ExamCountdown | null {
  if (goal === "general") return null;
  const config = EXAM_DATES[goal];
  const target = new Date(`${config.date}T09:00:00+03:00`);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return null;

  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const hoursRemaining = Math.ceil(diffMs / (1000 * 60 * 60));

  return {
    examType: goal,
    label: config.label,
    examDate: config.date,
    daysRemaining,
    hoursRemaining,
  };
}

export function inferExamGoalFromAreas(areaNames: string[]): ExamGoalType {
  const joined = areaNames.join(" ").toLowerCase();
  if (joined.includes("lgs")) return "lgs";
  if (joined.includes("yks") || joined.includes("tyt") || joined.includes("ayt")) return "yks";
  return "general";
}
