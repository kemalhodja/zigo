"use client";

import { useEffect, useState } from "react";
import {
  Award,
  BarChart2,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  TrendingUp,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import { CertificateModal, type CertificateData } from "@/components/teacher/certificate-modal";
import { createClient } from "@/lib/supabase/client";

type StudentSummary = {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  totalPoints: number;
  quizzesCompleted: number;
  averageScore: number;
  correctRate: number;
  lastActivity: string | null;
};

type QuizAttempt = {
  quizTitle: string;
  score: number;
  maxScore: number;
  correct: number;
  total: number;
  completedAt: string;
};

// Demo data shown when teacher has no students yet
function demoStudents(): StudentSummary[] {
  return [
    { userId: "demo1", fullName: "Zeynep Arslan (Demo)", avatarUrl: null, totalPoints: 3240, quizzesCompleted: 12, averageScore: 88, correctRate: 92, lastActivity: new Date(Date.now() - 3600_000).toISOString() },
    { userId: "demo2", fullName: "Ahmet Yıldız (Demo)", avatarUrl: null, totalPoints: 2100, quizzesCompleted: 8, averageScore: 72, correctRate: 76, lastActivity: new Date(Date.now() - 86400_000).toISOString() },
    { userId: "demo3", fullName: "Elif Kaya (Demo)", avatarUrl: null, totalPoints: 1850, quizzesCompleted: 7, averageScore: 65, correctRate: 69, lastActivity: new Date(Date.now() - 172800_000).toISOString() },
    { userId: "demo4", fullName: "Mert Demir (Demo)", avatarUrl: null, totalPoints: 4100, quizzesCompleted: 15, averageScore: 94, correctRate: 96, lastActivity: new Date(Date.now() - 1800_000).toISOString() },
  ];
}

function demoAttempts(): QuizAttempt[] {
  return [
    { quizTitle: "Denklemler — LGS Deneme 1", score: 45, maxScore: 50, correct: 9, total: 10, completedAt: new Date(Date.now() - 7200_000).toISOString() },
    { quizTitle: "Hücre Biyolojisi", score: 36, maxScore: 50, correct: 7, total: 10, completedAt: new Date(Date.now() - 90000_000).toISOString() },
    { quizTitle: "Türkçe Paragraf", score: 25, maxScore: 50, correct: 5, total: 10, completedAt: new Date(Date.now() - 180000_000).toISOString() },
  ];
}

function StudentSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center gap-3 px-4 py-3.5 animate-pulse">
            <div className="size-7 rounded-full bg-slate-200 shrink-0" />
            <div className="size-9 rounded-full bg-slate-200 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-slate-200 rounded w-32" />
              <div className="h-2.5 bg-slate-100 rounded w-24" />
            </div>
            <div className="h-6 w-12 bg-slate-200 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

function getScoreColor(rate: number) {
  if (rate >= 85) return "text-emerald-600 bg-emerald-50";
  if (rate >= 65) return "text-amber-600 bg-amber-50";
  return "text-rose-600 bg-rose-50";
}

function timeAgo(iso: string | null): string {
  if (!iso) return "Bilinmiyor";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} dk önce`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} sa önce`;
  return `${Math.floor(hrs / 24)} gün önce`;
}

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [certData, setCertData] = useState<CertificateData | null>(null);
  const [sortBy, setSortBy] = useState<"points" | "score" | "activity">("points");

  const supabase = createClient();

  // Fetch real students from API
  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setStudents(demoStudents()); setAttempts(demoAttempts()); setIsDemo(true); setIsLoading(false); return; }

        const { data: quizzes } = await supabase
          .from("user_quizzes")
          .select("id, title")
          .eq("creator_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);

        if (!quizzes || quizzes.length === 0) {
          setStudents(demoStudents()); setAttempts(demoAttempts()); setIsDemo(true); setIsLoading(false); return;
        }

        const quizIds = quizzes.map((q) => q.id as string);
        const { data: rawAttempts } = await supabase
          .from("quiz_attempts")
          .select("user_id, quiz_id, score, max_score, correct_answers, total_questions, completed_at")
          .in("quiz_id", quizIds)
          .order("completed_at", { ascending: false })
          .limit(200);

        if (!rawAttempts || rawAttempts.length === 0) {
          setStudents(demoStudents()); setAttempts(demoAttempts()); setIsDemo(true); setIsLoading(false); return;
        }

        const userIds = [...new Set(rawAttempts.map((a) => a.user_id as string))];
        const { data: profiles } = await supabase
          .from("users")
          .select("id, full_name, avatar_url, xp_points")
          .in("id", userIds);

        const profileMap = new Map((profiles ?? []).map((p) => [p.id as string, p]));
        const studentMap = new Map<string, StudentSummary>();

        for (const attempt of rawAttempts) {
          const uid = attempt.user_id as string;
          const profile = profileMap.get(uid);
          const existing = studentMap.get(uid);
          const correct = Number(attempt.correct_answers ?? 0);
          const total = Number(attempt.total_questions ?? 1);
          const score = Number(attempt.score ?? 0);
          const maxScore = Number(attempt.max_score ?? total);
          const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

          if (!existing) {
            studentMap.set(uid, {
              userId: uid,
              fullName: (profile?.full_name as string) || "Öğrenci",
              avatarUrl: (profile?.avatar_url as string | null) ?? null,
              totalPoints: Number(profile?.xp_points ?? 0),
              quizzesCompleted: 1,
              averageScore: Math.round((score / Math.max(maxScore, 1)) * 100),
              correctRate: pct,
              lastActivity: attempt.completed_at as string | null,
            });
          } else {
            const n = existing.quizzesCompleted + 1;
            existing.quizzesCompleted = n;
            existing.correctRate = Math.round((existing.correctRate * (n - 1) + pct) / n);
            existing.averageScore = Math.round((existing.averageScore * (n - 1) + Math.round((score / Math.max(maxScore, 1)) * 100)) / n);
            if (attempt.completed_at && (!existing.lastActivity || new Date(attempt.completed_at as string) > new Date(existing.lastActivity))) {
              existing.lastActivity = attempt.completed_at as string;
            }
          }
        }

        const quizTitleMap = new Map(quizzes.map((q) => [q.id as string, q.title as string]));
        const attemptList: QuizAttempt[] = rawAttempts.slice(0, 10).map((a) => ({
          quizTitle: quizTitleMap.get(a.quiz_id as string) ?? "Quiz",
          score: Number(a.score ?? 0),
          maxScore: Number(a.max_score ?? 1),
          correct: Number(a.correct_answers ?? 0),
          total: Number(a.total_questions ?? 1),
          completedAt: (a.completed_at as string) ?? "",
        }));

        const studentList = Array.from(studentMap.values());
        setStudents(studentList.length > 0 ? studentList : demoStudents());
        setAttempts(attemptList.length > 0 ? attemptList : demoAttempts());
        setIsDemo(studentList.length === 0);
      } catch {
        setStudents(demoStudents()); setAttempts(demoAttempts()); setIsDemo(true);
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sorted = [...students].sort((a, b) => {
    if (sortBy === "points") return b.totalPoints - a.totalPoints;
    if (sortBy === "score") return b.averageScore - a.averageScore;
    return new Date(b.lastActivity ?? 0).getTime() - new Date(a.lastActivity ?? 0).getTime();
  });

  const topStudent = sorted[0];
  const avgCorrect = students.reduce((s, st) => s + st.correctRate, 0) / (students.length || 1);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Certificate Modal */}
      {certData && (
        <CertificateModal
          isOpen
          onClose={() => setCertData(null)}
          data={certData}
        />
      )}

      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-slate-100 bg-white px-4 py-4 shadow-xs">
        <div className="mx-auto max-w-2xl flex items-center justify-between">
          <div>
            <p className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-slate-400">Öğretmen Stüdyo</p>
            <h1 className="text-xl font-black text-slate-900">📊 Öğrenci Performans Raporu</h1>
          </div>
          {isLoading ? (
            <Loader2 className="size-4 animate-spin text-slate-400" />
          ) : isDemo ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-[0.6rem] font-black text-amber-700">
              📋 Demo Veri
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[0.6rem] font-black text-emerald-700">
              ✅ Gerçek Veri
            </span>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-4 px-4 pt-4">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="rounded-3xl bg-white border border-slate-100 p-4 text-center shadow-sm">
            <Users className="mx-auto size-5 text-indigo-500" />
            <p className="mt-1.5 text-2xl font-black text-slate-900">{isLoading ? "—" : students.length}</p>
            <p className="text-[0.65rem] font-bold text-slate-500">Öğrenci</p>
          </div>
          <div className="rounded-3xl bg-white border border-slate-100 p-4 text-center shadow-sm">
            <TrendingUp className="mx-auto size-5 text-emerald-500" />
            <p className="mt-1.5 text-2xl font-black text-emerald-700">{isLoading ? "—" : `${Math.round(avgCorrect)}%`}</p>
            <p className="text-[0.65rem] font-bold text-slate-500">Ort. Doğru</p>
          </div>
          <div className="rounded-3xl bg-white border border-slate-100 p-4 text-center shadow-sm">
            <Award className="mx-auto size-5 text-yellow-500" />
            <p className="mt-1.5 text-xs font-black text-slate-900 truncate">{isLoading ? "—" : topStudent?.fullName.split(" ")[0]}</p>
            <p className="text-[0.65rem] font-bold text-slate-500">Lider</p>
          </div>
        </div>

        {/* Sort Bar */}
        <div className="flex gap-2">
          {(["points", "score", "activity"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSortBy(s)}
              className={`flex-1 rounded-xl py-2 text-xs font-bold transition tap-scale ${
                sortBy === s ? "bg-indigo-600 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {s === "points" ? "Puan" : s === "score" ? "Başarı %" : "Son Aktivite"}
            </button>
          ))}
        </div>

        {/* Student Cards */}
        {isLoading ? (
          <StudentSkeleton />
        ) : students.length === 0 ? (
          <div className="rounded-3xl bg-white border border-dashed border-slate-200 p-10 text-center">
            <p className="text-2xl mb-2">🎓</p>
            <p className="text-sm font-black text-slate-600">Henüz öğrencini bulunmuyor</p>
            <p className="text-xs text-slate-400 mt-1">Quiz paylaştıkça öğrencileriniz burada görünecek</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((student, rank) => {
            const isExpanded = expanded === student.userId;
            return (
              <div
                key={student.userId}
                className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm"
              >
                {/* Card Header */}
                <button
                  type="button"
                  onClick={() => setExpanded(isExpanded ? null : student.userId)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 transition"
                >
                  {/* Rank */}
                  <span className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                    rank === 0 ? "bg-yellow-400 text-yellow-900" :
                    rank === 1 ? "bg-slate-300 text-slate-700" :
                    rank === 2 ? "bg-amber-700/30 text-amber-800" :
                    "bg-slate-100 text-slate-500"
                  }`}>
                    {rank + 1}
                  </span>

                  {/* Avatar */}
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-black text-white">
                    {student.fullName.charAt(0)}
                  </div>

                  {/* Name + sub */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-900 truncate">{student.fullName}</p>
                    <p className="text-xs font-semibold text-slate-400">{student.quizzesCompleted} quiz · {timeAgo(student.lastActivity)}</p>
                  </div>

                  {/* Score Badge */}
                  <span className={`rounded-lg px-2.5 py-1 text-xs font-black ${getScoreColor(student.correctRate)}`}>
                    {student.correctRate}%
                  </span>

                  {isExpanded ? <ChevronUp className="size-4 text-slate-400 shrink-0" /> : <ChevronDown className="size-4 text-slate-400 shrink-0" />}
                </button>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-slate-100 px-4 py-4 space-y-4">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-2xl bg-indigo-50 p-3">
                        <p className="text-lg font-black text-indigo-700">{student.totalPoints.toLocaleString("tr-TR")}</p>
                        <p className="text-[0.6rem] font-bold text-indigo-500">Toplam Puan</p>
                      </div>
                      <div className="rounded-2xl bg-emerald-50 p-3">
                        <p className="text-lg font-black text-emerald-700">{student.averageScore}%</p>
                        <p className="text-[0.6rem] font-bold text-emerald-500">Ort. Skor</p>
                      </div>
                      <div className="rounded-2xl bg-violet-50 p-3">
                        <p className="text-lg font-black text-violet-700">{student.quizzesCompleted}</p>
                        <p className="text-[0.6rem] font-bold text-violet-500">Quiz</p>
                      </div>
                    </div>

                    {/* Performance Bar */}
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-600">Doğruluk Oranı</span>
                        <span className="font-black text-slate-900">{student.correctRate}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            student.correctRate >= 85 ? "bg-emerald-500" :
                            student.correctRate >= 65 ? "bg-amber-400" : "bg-rose-400"
                          }`}
                          style={{ width: `${student.correctRate}%` }}
                        />
                      </div>
                    </div>

                    {/* Recent attempts */}
                    {attempts.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">Son Çözümler</p>
                        <div className="space-y-1.5">
                          {attempts.map((att, i) => {
                            const pct = Math.round((att.correct / att.total) * 100);
                            return (
                              <div key={i} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <BookOpen className="size-3.5 shrink-0 text-slate-400" />
                                  <span className="text-xs font-semibold text-slate-700 truncate">{att.quizTitle}</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className={`text-xs font-black rounded-md px-1.5 py-0.5 ${getScoreColor(pct)}`}>{pct}%</span>
                                  {pct >= 70 ? <CheckCircle2 className="size-3.5 text-emerald-500" /> : <XCircle className="size-3.5 text-rose-400" />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          const bestAttempt = attempts[0];
                          setCertData({
                            studentName: student.fullName,
                            quizTitle: bestAttempt?.quizTitle ?? "Zigo Quiz",
                            score: bestAttempt ? bestAttempt.score : Math.round(student.averageScore * 0.5),
                            maxScore: bestAttempt ? bestAttempt.maxScore : 50,
                            correct: bestAttempt?.correct ?? Math.round(student.quizzesCompleted * 0.8),
                            total: bestAttempt?.total ?? student.quizzesCompleted,
                            teacherName: "Öğretmeniniz",
                            teacherTitle: "Zigo Öğretmeni",
                          });
                        }}
                        className="tap-scale flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-yellow-500 py-2.5 text-xs font-black text-white hover:bg-yellow-400 transition"
                      >
                        <Award className="size-3.5" />
                        Sertifika Oluştur
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const wa = `https://wa.me/?text=${encodeURIComponent(`${student.fullName} öğrencim Zigo'daki performansı: ${student.correctRate}% doğruluk oranı, ${student.totalPoints} puan! 🎉`)}`;
                          window.open(wa, "_blank");
                        }}
                        className="tap-scale flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 py-2.5 text-xs font-black text-white hover:bg-emerald-500 transition"
                      >
                        <Zap className="size-3.5" />
                        Veli Bildir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        )}

        {isDemo && !isLoading && (
          <p className="text-center text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded-2xl py-3 px-4">
            📋 Demo verisi gösteriliyor. Quiz paylaşıp öğrencilerinizin çözmesini sağlayın.
          </p>
        )}

        {/* Bar Chart Viz */}
        <div className="rounded-3xl bg-white border border-slate-100 p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <BarChart2 className="size-4 text-indigo-500" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">Sınıf Başarı Dağılımı</span>
          </div>
          <div className="flex items-end gap-2 h-28">
            {sorted.map((s, i) => {
              const h = Math.max((s.correctRate / 100) * 100, 8);
              return (
                <div key={s.userId} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t-xl transition-all duration-500 ${
                      i === 0 ? "bg-gradient-to-t from-yellow-500 to-yellow-400" :
                      s.correctRate >= 85 ? "bg-gradient-to-t from-emerald-500 to-emerald-400" :
                      s.correctRate >= 65 ? "bg-gradient-to-t from-amber-500 to-amber-400" :
                      "bg-gradient-to-t from-rose-400 to-rose-300"
                    }`}
                    style={{ height: `${h}%` }}
                  />
                  <span className="text-[0.6rem] font-bold text-slate-500 text-center leading-tight truncate w-full text-center">
                    {s.fullName.split(" ")[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
