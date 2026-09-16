import { filterActiveExams, filterActiveHomeworks } from "./service";
import type { ArchivedExam, ExamItem, HomeworkItem, ScheduleLesson } from "./types";

const AGENDA_STORAGE_PREFIX = "zigo_agenda_data_v1";

export type StoredAgendaState = {
  lessons: ScheduleLesson[];
  exams: ExamItem[];
  homeworks: HomeworkItem[];
  archivedExams: ArchivedExam[];
};

function getStorageKey(targetUserId?: string): string {
  const suffix = targetUserId ? `_${targetUserId}` : "_default";
  return `${AGENDA_STORAGE_PREFIX}${suffix}`;
}

export const DEMO_AGENDA_LESSONS: ScheduleLesson[] = [
  { id: "demo-l-1", dayOfWeek: 1, subject: "Matematik", startTime: "09:00", endTime: "09:40", teacherName: "Ahmet Hoca", classroom: "Derslik 3A" },
  { id: "demo-l-2", dayOfWeek: 1, subject: "Türkçe", startTime: "09:55", endTime: "10:35", teacherName: "Elif Hoca", classroom: "Derslik 3A" },
  { id: "demo-l-3", dayOfWeek: 1, subject: "Fen Bilimleri", startTime: "10:50", endTime: "11:30", teacherName: "Kemal Hoca", classroom: "Laboratuvar" },
  { id: "demo-l-4", dayOfWeek: 2, subject: "İngilizce", startTime: "09:00", endTime: "09:40", teacherName: "Sarah Hoca", classroom: "Derslik 3A" },
  { id: "demo-l-5", dayOfWeek: 2, subject: "Sosyal Bilgiler", startTime: "09:55", endTime: "10:35", teacherName: "Murat Hoca", classroom: "Derslik 3A" },
  { id: "demo-l-6", dayOfWeek: 3, subject: "Matematik", startTime: "09:00", endTime: "09:40", teacherName: "Ahmet Hoca", classroom: "Derslik 3A" },
  { id: "demo-l-7", dayOfWeek: 3, subject: "Müzik", startTime: "09:55", endTime: "10:35", teacherName: "Can Hoca", classroom: "Müzik Atölyesi" },
  { id: "demo-l-8", dayOfWeek: 4, subject: "Fen Bilimleri", startTime: "09:00", endTime: "09:40", teacherName: "Kemal Hoca", classroom: "Laboratuvar" },
  { id: "demo-l-9", dayOfWeek: 4, subject: "Bilişim & Kodlama", startTime: "09:55", endTime: "10:35", teacherName: "Zeynep Hoca", classroom: "Bilgisayar Labı" },
  { id: "demo-l-10", dayOfWeek: 5, subject: "Türkçe", startTime: "09:00", endTime: "09:40", teacherName: "Elif Hoca", classroom: "Derslik 3A" },
  { id: "demo-l-11", dayOfWeek: 5, subject: "Görsel Sanatlar", startTime: "09:55", endTime: "10:35", teacherName: "Selin Hoca", classroom: "Resim Atölyesi" },
];

/**
 * İstemci tarafında kaydedilmiş ajanda verisini döner.
 * Kritik Kural: Süresi dolan sınavlar ve ödevler otomatik temizlenir!
 */
export function getStoredAgenda(targetUserId?: string): StoredAgendaState {
  if (typeof window === "undefined") {
    return {
      lessons: DEMO_AGENDA_LESSONS,
      exams: [],
      homeworks: [],
      archivedExams: [],
    };
  }

  try {
    const key = getStorageKey(targetUserId);
    const raw = localStorage.getItem(key);

    let state: StoredAgendaState;

    if (!raw) {
      // Başlangıç için örnek yaklaşan sınav ve ödev oluştur:
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 2);
      nextWeek.setHours(18, 0, 0, 0);

      state = {
        lessons: DEMO_AGENDA_LESSONS,
        exams: [
          {
            id: "demo-ex-1",
            subject: "Matematik 1. Yazılı",
            examDate: tomorrow.toISOString(),
            topics: "Denklemler, Çarpanlara Ayırma ve Üslü Sayılar",
            durationMinutes: 40,
          },
        ],
        homeworks: [
          {
            id: "demo-hw-1",
            subject: "Fen Bilimleri",
            title: "Hücre ve Bölünmeler Ünitesi - Sayfa 42-45 Test Çözümü",
            dueDate: nextWeek.toISOString(),
            isCompleted: false,
            priority: "medium",
            notes: "",
          },
        ],
        archivedExams: [],
      };
      localStorage.setItem(key, JSON.stringify(state));
    } else {
      state = JSON.parse(raw);
    }

    // Otomatik Temizlik Kontrolü:
    const now = new Date();
    const activeExams = filterActiveExams(state.exams ?? [], now);
    const activeHomeworks = filterActiveHomeworks(state.homeworks ?? [], now);

    // Eğer süresi dolmuş sınav veya ödev temizlendiyse depolamayı hemen güncelle
    if (
      activeExams.length !== (state.exams ?? []).length ||
      activeHomeworks.length !== (state.homeworks ?? []).length
    ) {
      state.exams = activeExams;
      state.homeworks = activeHomeworks;
      localStorage.setItem(key, JSON.stringify(state));
    }

    return {
      lessons: state.lessons ?? [],
      exams: activeExams,
      homeworks: activeHomeworks,
      archivedExams: state.archivedExams ?? [],
    };
  } catch {
    return {
      lessons: DEMO_AGENDA_LESSONS,
      exams: [],
      homeworks: [],
      archivedExams: [],
    };
  }
}

/**
 * Ajanda durumunu kaydeder ve diğer pencereleri/bileşenleri uyarır.
 */
export function saveAgendaState(state: StoredAgendaState, targetUserId?: string): void {
  if (typeof window === "undefined") return;
  try {
    const key = getStorageKey(targetUserId);
    const now = new Date();
    const cleanedState: StoredAgendaState = {
      lessons: state.lessons ?? [],
      exams: filterActiveExams(state.exams ?? [], now),
      homeworks: filterActiveHomeworks(state.homeworks ?? [], now),
      archivedExams: state.archivedExams ?? [],
    };
    localStorage.setItem(key, JSON.stringify(cleanedState));
    window.dispatchEvent(new CustomEvent("zigo:agenda-updated", { detail: { targetUserId } }));
  } catch (err) {
    console.error("Ajanda kaydedilemedi:", err);
  }
}
