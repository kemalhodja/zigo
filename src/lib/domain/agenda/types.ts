import { z } from "zod";

// --- Ders Renk Paleti ---
const SUBJECT_COLOR_MAP: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  "matematik":    { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-200",   dot: "#3b82f6" },
  "türkçe":       { bg: "bg-violet-100", text: "text-violet-800", border: "border-violet-200", dot: "#8b5cf6" },
  "fen":          { bg: "bg-emerald-100",text: "text-emerald-800",border: "border-emerald-200",dot: "#10b981" },
  "fizik":        { bg: "bg-cyan-100",   text: "text-cyan-800",   border: "border-cyan-200",   dot: "#06b6d4" },
  "kimya":        { bg: "bg-lime-100",   text: "text-lime-800",   border: "border-lime-200",   dot: "#84cc16" },
  "biyoloji":     { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-200",  dot: "#22c55e" },
  "ingilizce":    { bg: "bg-sky-100",    text: "text-sky-800",    border: "border-sky-200",    dot: "#0ea5e9" },
  "tarih":        { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-200",  dot: "#f59e0b" },
  "coğrafya":     { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-200", dot: "#f97316" },
  "müzik":        { bg: "bg-pink-100",   text: "text-pink-800",   border: "border-pink-200",   dot: "#ec4899" },
  "beden":        { bg: "bg-rose-100",   text: "text-rose-800",   border: "border-rose-200",   dot: "#f43f5e" },
  "din":          { bg: "bg-teal-100",   text: "text-teal-800",   border: "border-teal-200",   dot: "#14b8a6" },
  "felsefe":      { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200", dot: "#a855f7" },
  "edebiyat":     { bg: "bg-fuchsia-100",text: "text-fuchsia-800",border: "border-fuchsia-200",dot: "#d946ef" },
  "sosyal":       { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-200", dot: "#eab308" },
  "inkılap":      { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-200", dot: "#eab308" },
  "bilişim":      { bg: "bg-indigo-100", text: "text-indigo-800", border: "border-indigo-200", dot: "#6366f1" },
  "görsel":       { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-200",    dot: "#ef4444" },
  "rehberlik":    { bg: "bg-slate-100",  text: "text-slate-700",  border: "border-slate-200",  dot: "#64748b" },
  "geometri":     { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-200",   dot: "#3b82f6" },
  "almanca":      { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-200",  dot: "#f59e0b" },
  "fransızca":    { bg: "bg-indigo-100", text: "text-indigo-800", border: "border-indigo-200", dot: "#6366f1" },
};

const DEFAULT_COLOR = { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200", dot: "#64748b" };

/**
 * Ders adına göre renk kodunu döner.
 * Tutarlı renk için tüm UI bileşenlerinde bu fonksiyon kullanılmalıdır.
 */
export function getSubjectColor(subject: string): { bg: string; text: string; border: string; dot: string } {
  const lower = subject.toLowerCase();
  for (const [key, color] of Object.entries(SUBJECT_COLOR_MAP)) {
    if (lower.includes(key)) return color;
  }
  return DEFAULT_COLOR;
}

export const DAYS_OF_WEEK = [
  { value: 1, label: "Pazartesi", shortLabel: "Pzt" },
  { value: 2, label: "Salı", shortLabel: "Sal" },
  { value: 3, label: "Çarşamba", shortLabel: "Çar" },
  { value: 4, label: "Perşembe", shortLabel: "Per" },
  { value: 5, label: "Cuma", shortLabel: "Cum" },
  { value: 6, label: "Cumartesi", shortLabel: "Cmt" },
  { value: 7, label: "Pazar", shortLabel: "Paz" },
] as const;

export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7;

// --- Ders Programı Şeması ---
export const scheduleLessonSchema = z.object({
  id: z.string().min(1),
  dayOfWeek: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
    z.literal(7),
  ]),
  subject: z.string().trim().min(1, "Ders adı zorunludur").max(60),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Başlangıç saati SS:DD formatında olmalıdır"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Bitiş saati SS:DD formatında olmalıdır"),
  teacherName: z.string().trim().max(60).optional(),
  classroom: z.string().trim().max(40).optional(),
  targetUserId: z.string().optional(),
  createdAt: z.string().optional(),
});

export type ScheduleLesson = z.infer<typeof scheduleLessonSchema>;

// --- Sınav Alt Konu Şeması ---
export const examSubtopicSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(100),
  isDone: z.boolean().default(false),
});

export type ExamSubtopic = z.infer<typeof examSubtopicSchema>;

// --- Sınav Şeması ---
export const examItemSchema = z.object({
  id: z.string().min(1),
  subject: z.string().trim().min(1, "Ders adı zorunludur").max(60),
  examDate: z.string().min(1, "Sınav tarihi zorunludur"), // ISO string or YYYY-MM-DDTHH:mm
  topics: z.string().trim().max(300).optional().default(""),
  subtopics: z.array(examSubtopicSchema).optional(),
  durationMinutes: z.number().int().min(10).max(300).optional().default(40),
  targetUserId: z.string().optional(),
  createdAt: z.string().optional(),
});

export type ExamItem = z.infer<typeof examItemSchema>;

// --- Ödev Şeması ---
export const homeworkItemSchema = z.object({
  id: z.string().min(1),
  subject: z.string().trim().min(1, "Ders adı zorunludur").max(60),
  title: z.string().trim().min(1, "Ödev açıklaması zorunludur").max(200),
  dueDate: z.string().min(1, "Bitiş tarihi zorunludur"), // ISO string or YYYY-MM-DDTHH:mm
  isCompleted: z.boolean().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  notes: z.string().trim().max(500).optional(),
  targetUserId: z.string().optional(),
  createdAt: z.string().optional(),
});

export type HomeworkItem = z.infer<typeof homeworkItemSchema>;

export const HOMEWORK_PRIORITY_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  low:    { label: "Düşük",  color: "text-slate-600", bg: "bg-slate-100",   border: "border-slate-200" },
  medium: { label: "Orta",   color: "text-blue-700",  bg: "bg-blue-50",     border: "border-blue-200" },
  high:   { label: "Yüksek", color: "text-amber-700", bg: "bg-amber-50",    border: "border-amber-200" },
  urgent: { label: "Acil",   color: "text-rose-700",  bg: "bg-rose-50",     border: "border-rose-200" },
};

// --- Sınav Arşivi ---
export const archivedExamSchema = z.object({
  id: z.string().min(1),
  subject: z.string().trim().min(1).max(60),
  examDate: z.string(),
  topics: z.string().optional().default(""),
  durationMinutes: z.number().optional().default(40),
  score: z.number().min(0).max(100).optional(),
  notes: z.string().trim().max(300).optional().default(""),
  archivedAt: z.string(),
  targetUserId: z.string().optional(),
});

export type ArchivedExam = z.infer<typeof archivedExamSchema>;

// --- Bildirim ve Alarm Tipleri ---
export type AgendaAlertSummary = {
  tomorrowDayName: string;
  tomorrowLessons: ScheduleLesson[];
  upcomingExams: (ExamItem & { hoursLeft: number; isTomorrow: boolean; isToday: boolean })[];
  pendingHomeworks: (HomeworkItem & { hoursLeft: number; isUrgent: boolean })[];
};
