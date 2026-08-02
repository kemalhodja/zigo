import { type GradeCategoryKey,resolveGradeCategory } from "@/lib/domain/education-catalog";

export const GENERAL_INTEREST_AGE_GROUP = "Genel İlgi";

/** Seeded Genel İlgi niches used as the teacher expertise matrix (051 + 080). */
export const GENERAL_INTEREST_EXPERTISE_AREAS = [
  "Genel Kültür",
  "Sağlık",
  "Dini Bilgiler",
  "Haber ve Gündem",
  "Spor",
  "Futbol",
  "Basketbol",
  "Voleybol",
  "Bilim ve Teknoloji",
  "Sanat ve Müzik",
  "Doğa ve Çevre",
  "Psikoloji ve İyi Yaşam",
  "Eğitim ve Pedagoji",
  "Çalışma Teknikleri",
  "Sınav Motivasyonu",
  "Üniversite ve Tercih",
  "Kariyer ve Meslek",
  "Burs ve Yurt Dışı Eğitim",
  "Yapay Zeka",
  "Kodlama ve Yazılım",
  "Robotik ve STEM",
  "Astronomi",
  "Popüler Matematik",
  "Popüler Bilim",
  "Tarih ve Medeniyet",
  "Coğrafya ve Seyahat",
  "Dil Öğrenme",
  "İngilizce",
  "Kitap ve Okuma",
  "Yaratıcı Yazarlık",
  "Sinema ve Medya",
  "Fotoğrafçılık",
  "Podcast ve İçerik Üretimi",
  "Felsefe ve Mantık",
  "Finansal Okuryazarlık",
  "Girişimcilik",
  "Beslenme ve Diyet",
  "Ebeveynlik",
  "Çocuk Gelişimi",
  "Özel Eğitim",
  "İklim ve Sürdürülebilirlik",
  "Gönüllülük ve Sosyal Sorumluluk",
  "Hukuk Okuryazarlığı",
  "İnovasyon ve Tasarım",
  "Tenis",
  "Yüzme",
  "Satranç",
  "E-Spor",
] as const;

type AreaLike = {
  id: number;
  age_group: string | null;
};

export function isGeneralInterestArea(area: Pick<AreaLike, "age_group">) {
  return resolveGradeCategory(area.age_group) === "generalInterest";
}

/** Öğrenci, veli ve öğretmen için branş ve Keşfet ilgi alanı seçimine izin verir. */
export function filterAreasForInterestSelection<T extends AreaLike>(
  areas: T[],
  _role: "teacher" | "parent" | "student",
): T[] {
  return areas;
}

export function isTeacherGeneralInterestSelection<T extends AreaLike>(
  selectedAreas: T[],
): boolean {
  if (selectedAreas.length !== 1) return false;
  return isGeneralInterestArea(selectedAreas[0]!);
}

export function generalInterestGradeKey(): GradeCategoryKey {
  return "generalInterest";
}
