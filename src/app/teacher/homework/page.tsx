"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  MessageCircle,
  Plus,
  Share2,
  Trash2,
  Users,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { HomeworkModal } from "@/components/teacher/homework-modal";

interface HomeworkItem {
  id: string;
  quizTitle: string;
  quizId: string;
  classes: string[];
  dueDate: string;
  note?: string;
  assignedAt: string;
  totalStudents: number;
  completedCount: number;
}

const DEFAULT_HOMEWORKS: HomeworkItem[] = [
  {
    id: "hw-1",
    quizTitle: "8. Sınıf Üslü İfadeler LGS Hazırlık Testi",
    quizId: "quiz-mock-1",
    classes: ["8-A", "8-B"],
    dueDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
    note: "Çözüm açıklamalarını mutlaka okuyun. 2. sorudaki yeni nesil soru kalıbına dikkat edin.",
    assignedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    totalStudents: 50,
    completedCount: 38,
  },
  {
    id: "hw-2",
    quizTitle: "Kareköklü Sayılar MEB Kazanım Değerlendirme",
    quizId: "quiz-mock-2",
    classes: ["8-A"],
    dueDate: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString(),
    note: "Süre sınırlaması 25 dakikadır.",
    assignedAt: new Date().toISOString(),
    totalStudents: 26,
    completedCount: 12,
  },
  {
    id: "hw-3",
    quizTitle: "Milli Mücadele Dönemi Tarih Quiz'i",
    quizId: "quiz-mock-3",
    classes: ["8-B"],
    dueDate: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    note: "Amasya Genelgesi maddelerine odaklanın.",
    assignedAt: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
    totalStudents: 24,
    completedCount: 24,
  },
];

export default function TeacherHomeworkPage() {
  const router = useRouter();
  const [homeworks, setHomeworks] = useState<HomeworkItem[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("zigo_teacher_homeworks");
      if (saved) {
        setHomeworks(JSON.parse(saved));
      } else {
        setHomeworks(DEFAULT_HOMEWORKS);
        localStorage.setItem("zigo_teacher_homeworks", JSON.stringify(DEFAULT_HOMEWORKS));
      }
    } catch {
      setHomeworks(DEFAULT_HOMEWORKS);
    }
  }, []);

  function triggerHaptic(type: "click" | "success" | "warn" = "click") {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      if (type === "click") navigator.vibrate(8);
      else if (type === "success") navigator.vibrate([15, 30, 20]);
      else if (type === "warn") navigator.vibrate([30, 30, 30]);
    }
  }

  function handleDelete(id: string) {
    if (window.confirm("Bu ödevi ve takip kaydını silmek istediğinize emin misiniz?")) {
      triggerHaptic("warn");
      setHomeworks((prev) => {
        const next = prev.filter((h) => h.id !== id);
        localStorage.setItem("zigo_teacher_homeworks", JSON.stringify(next));
        return next;
      });
    }
  }

  function handleShareWhatsApp(hw: HomeworkItem) {
    triggerHaptic("click");
    const link = typeof window !== "undefined" ? `${window.location.origin}/quizzes` : "https://zigo.app/quizzes";
    const text = `📢 Sayın Veliler ve Sevgili Öğrenciler (${hw.classes.join(", ")}),\n\n"${hw.quizTitle}" başlıklı ödeviniz atanmıştır.\n\n🗓️ Son Teslim: ${new Date(hw.dueDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}\n${hw.note ? `📝 Öğretmen Notu: ${hw.note}\n` : ""}\n🔗 Ödeve Zigo üzerinden erişebilirsiniz: ${link}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  }

  function handleCopyLink(hw: HomeworkItem) {
    triggerHaptic("success");
    const link = typeof window !== "undefined" ? `${window.location.origin}/quizzes` : "https://zigo.app/quizzes";
    void navigator.clipboard?.writeText(link);
    setCopiedId(hw.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const now = new Date().getTime();
  const filtered = homeworks.filter((hw) => {
    const isOverdue = new Date(hw.dueDate).getTime() < now;
    const isAllDone = hw.completedCount >= hw.totalStudents;
    if (filter === "active") return !isOverdue && !isAllDone;
    if (filter === "completed") return isOverdue || isAllDone;
    return true;
  });

  const totalAssigned = homeworks.length;
  const totalSubmissions = homeworks.reduce((acc, h) => acc + h.completedCount, 0);
  const totalStudentsCount = homeworks.reduce((acc, h) => acc + h.totalStudents, 0);
  const overallRate = totalStudentsCount > 0 ? Math.round((totalSubmissions / totalStudentsCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* Top Header */}
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/90 px-4 py-3.5 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/teacher")}
              className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600 hover:bg-slate-200"
            >
              <ArrowLeft className="size-4" />
            </button>
            <div>
              <h1 className="text-base font-black text-slate-900">Ödev & Teslim Takip Paneli</h1>
              <p className="text-[0.68rem] font-bold text-slate-400">
                Sınıflara ödev ata, teslim sürelerini ve başarı oranlarını izle
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsModalOpen(true);
              triggerHaptic("click");
            }}
            className="tap-scale flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-indigo-700 transition"
          >
            <Plus className="size-4" />
            <span>Yeni Ödev Ata</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl p-4 space-y-5">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-2xs">
            <span className="text-[0.68rem] font-black uppercase tracking-wider text-slate-400">Toplam Ödev</span>
            <p className="mt-1 text-2xl font-black text-slate-800">{totalAssigned}</p>
            <span className="text-[0.62rem] font-bold text-indigo-600">Aktif & Geçmiş</span>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-2xs">
            <span className="text-[0.68rem] font-black uppercase tracking-wider text-slate-400">Teslim Oranı</span>
            <p className="mt-1 text-2xl font-black text-emerald-600">%{overallRate}</p>
            <span className="text-[0.62rem] font-bold text-emerald-700">Genel Katılım</span>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-2xs">
            <span className="text-[0.68rem] font-black uppercase tracking-wider text-slate-400">Tamamlanan</span>
            <p className="mt-1 text-2xl font-black text-slate-800">{totalSubmissions}</p>
            <span className="text-[0.62rem] font-bold text-slate-400">Öğrenci Çözümü</span>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-2xs">
            <span className="text-[0.68rem] font-black uppercase tracking-wider text-slate-400">Bekleyen</span>
            <p className="mt-1 text-2xl font-black text-amber-600">
              {Math.max(0, totalStudentsCount - totalSubmissions)}
            </p>
            <span className="text-[0.62rem] font-bold text-amber-600">Çözüm Bekliyor</span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5 rounded-xl bg-slate-200/60 p-1">
            {[
              { id: "all", label: "Tüm Ödevler" },
              { id: "active", label: "Aktif Sürenler" },
              { id: "completed", label: "Tamamlananlar" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setFilter(tab.id as any);
                  triggerHaptic("click");
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-black transition ${
                  filter === tab.id
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-xs font-bold text-slate-400">
            {filtered.length} Ödev Listelendi
          </span>
        </div>

        {/* Homework List */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <BookOpen className="size-12 text-slate-300 mb-3" />
            <h3 className="text-sm font-black text-slate-700">Bu filtrelere uygun ödev bulunamadı</h3>
            <p className="text-xs font-semibold text-slate-400 mt-1 max-w-xs">
              Yeni bir quiz veya test hazırlayarak öğrencilerinize ödev olarak atayabilirsiniz.
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white hover:bg-indigo-700"
            >
              Hemen Ödev Ata
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((hw) => {
              const due = new Date(hw.dueDate).getTime();
              const isOverdue = due < now;
              const diffHours = Math.round((due - now) / (1000 * 3600));
              const percent = hw.totalStudents > 0 ? Math.round((hw.completedCount / hw.totalStudents) * 100) : 0;

              return (
                <div
                  key={hw.id}
                  className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[0.65rem] font-black text-indigo-700 border border-indigo-100">
                          {hw.classes.join(" · ")}
                        </span>
                        {isOverdue ? (
                          <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[0.65rem] font-black text-rose-700 border border-rose-200 flex items-center gap-1">
                            <Clock className="size-3" />
                            Süresi Doldu
                          </span>
                        ) : (
                          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-black text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <Clock className="size-3" />
                            {diffHours > 24 ? `${Math.ceil(diffHours / 24)} Gün Kaldı` : `${diffHours} Saat Kaldı`}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-black text-slate-800">{hw.quizTitle}</h3>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleShareWhatsApp(hw)}
                        className="tap-scale flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 hover:bg-emerald-100 transition"
                        title="Veli ve Sınıf Grubuna WhatsApp ile Duyur"
                      >
                        <MessageCircle className="size-3.5 text-emerald-600" />
                        <span>WhatsApp</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyLink(hw)}
                        className="tap-scale flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-700 hover:bg-slate-100 transition"
                      >
                        <Copy className="size-3.5 text-slate-500" />
                        <span>{copiedId === hw.id ? "Kopyalandı!" : "Linki Al"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(hw.id)}
                        className="rounded-xl p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                        title="Ödevi Sil"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>

                  {hw.note && (
                    <div className="rounded-2xl border border-indigo-50 bg-indigo-50/50 p-3 text-xs font-medium text-slate-700">
                      <span className="font-bold text-indigo-900">📌 Öğretmen Notu: </span>
                      {hw.note}
                    </div>
                  )}

                  {/* Progress Bar & Submission count */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-500">
                        Teslim Durumu: <strong className="text-slate-800">{hw.completedCount}</strong> / {hw.totalStudents} Öğrenci
                      </span>
                      <span className={percent === 100 ? "text-emerald-600 font-black" : "text-indigo-600 font-black"}>
                        %{percent} Tamamlandı
                      </span>
                    </div>

                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          percent === 100
                            ? "bg-emerald-500"
                            : percent > 60
                            ? "bg-indigo-600"
                            : "bg-amber-500"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer Info */}
                  <div className="flex items-center justify-between text-[0.68rem] font-semibold text-slate-400 pt-1">
                    <span>
                      Atanma: {new Date(hw.assignedAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                    </span>
                    <span>
                      Bitiş: {new Date(hw.dueDate).toLocaleDateString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Homework Modal */}
      <HomeworkModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          const saved = localStorage.getItem("zigo_teacher_homeworks");
          if (saved) setHomeworks(JSON.parse(saved));
        }}
      />
    </div>
  );
}
