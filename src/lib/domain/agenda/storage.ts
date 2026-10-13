import { filterActiveExams, filterActiveHomeworks } from "./service";
import type { ArchivedExam, ExamItem, HomeworkItem, ScheduleLesson } from "./types";

// v5, örnek programı bulunan tüm önceki sürümlerden bağımsız boş bir başlangıç sağlar.
const AGENDA_STORAGE_PREFIX = "zigo_agenda_data_v5";
const LESSONS_RESET_KEY = "zigo_agenda_lessons_manual_reset_v5";

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

/**
 * Tüm veli ve öğrencilerde ders programını tamamen sıfırlayan ve eski sürümleri temizleyen mekanizma.
 * Veli ve öğrenci ders programını sıfırdan manuel girer.
 */
function performGlobalLessonsResetIfNeeded(): void {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(LESSONS_RESET_KEY) === "done") {
      return;
    }

    // Tüm zigo_agenda anahtarlarındaki ders programlarını sıfırla ve eski sürümleri temizle
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k.startsWith("zigo_agenda_data_v1") || k.startsWith("zigo_agenda_data_v2") || k.startsWith("zigo_agenda_data_v3")) {
        keysToRemove.push(k);
      } else if (k.startsWith("zigo_agenda_data_v4") || k.startsWith(AGENDA_STORAGE_PREFIX)) {
        try {
          const raw = localStorage.getItem(k);
          if (raw) {
            const data = JSON.parse(raw);
            data.lessons = []; // Ders programını tamamen sıfırla
            localStorage.setItem(k, JSON.stringify(data));
          }
        } catch {}
      }
    }

    for (const oldKey of keysToRemove) {
      localStorage.removeItem(oldKey);
    }

    localStorage.setItem(LESSONS_RESET_KEY, "done");
  } catch {
    // sessizce geç
  }
}

/**
 * İstemci tarafında kaydedilmiş ajanda verisini döner.
 * Kritik Kural: Ders programı tamamen sıfırlanmış olarak başlar, veli ve öğrenci manuel girer.
 */
export function getStoredAgenda(targetUserId?: string): StoredAgendaState {
  if (typeof window === "undefined") {
    return { lessons: [], exams: [], homeworks: [], archivedExams: [] };
  }

  try {
    performGlobalLessonsResetIfNeeded();

    const key = getStorageKey(targetUserId);
    const raw = localStorage.getItem(key);

    let state: StoredAgendaState;

    if (!raw) {
      state = { lessons: [], exams: [], homeworks: [], archivedExams: [] };
      localStorage.setItem(key, JSON.stringify(state));
    } else {
      state = JSON.parse(raw);
    }

    // Otomatik Temizlik Kontrolü: süresi dolmuş sınav/ödev temizle
    const now = new Date();
    const activeExams = filterActiveExams(state.exams ?? [], now);
    const activeHomeworks = filterActiveHomeworks(state.homeworks ?? [], now);

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
    return { lessons: [], exams: [], homeworks: [], archivedExams: [] };
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

/**
 * Eski storage key'lerini temizler (migration).
 */
export function migrateAgendaStorage(targetUserId?: string): void {
  if (typeof window === "undefined") return;
  try {
    performGlobalLessonsResetIfNeeded();
    const suffix = targetUserId ? `_${targetUserId}` : "_default";
    localStorage.removeItem(`zigo_agenda_data_v1${suffix}`);
    localStorage.removeItem(`zigo_agenda_data_v2${suffix}`);
    localStorage.removeItem(`zigo_agenda_data_v3${suffix}`);
    localStorage.removeItem(`zigo_agenda_data_v4${suffix}`);
  } catch {
    // sessizce geç
  }
}
