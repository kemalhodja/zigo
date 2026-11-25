export type QuestionFormat = "lgs_4" | "yks_5" | "true_false" | "primary_3";
export type Difficulty = "easy" | "medium" | "hard";

export type DraftQuestion = {
  text: string;
  options: string[];
  correctIndex: number;
  type?: "multiple_choice" | "true_false";
  difficulty?: Difficulty;
  explanation?: string;
  imageUrl?: string;
};

export const DRAFT_STORAGE_KEY = "zigo_teacher_quiz_draft_v2";

export function createEmptyQuestion(
  format: QuestionFormat = "lgs_4",
  difficulty: Difficulty = "medium",
): DraftQuestion {
  switch (format) {
    case "yks_5":
      return {
        text: "",
        options: ["", "", "", "", ""],
        correctIndex: 0,
        type: "multiple_choice",
        difficulty,
        explanation: "",
      };
    case "true_false":
      return {
        text: "",
        options: ["Doğru", "Yanlış"],
        correctIndex: 0,
        type: "true_false",
        difficulty,
        explanation: "",
      };
    case "primary_3":
      return {
        text: "",
        options: ["", "", ""],
        correctIndex: 0,
        type: "multiple_choice",
        difficulty,
        explanation: "",
      };
    case "lgs_4":
    default:
      return {
        text: "",
        options: ["", "", "", ""],
        correctIndex: 0,
        type: "multiple_choice",
        difficulty,
        explanation: "",
      };
  }
}

export const TEMPLATE_PRESETS: {
  id: QuestionFormat;
  title: string;
  badge: string;
  desc: string;
  optCount: number;
  color: string;
}[] = [
  {
    id: "lgs_4",
    title: "LGS / Standart",
    badge: "4 Seçenek (A, B, C, D)",
    desc: "MEB LGS, ortaokul ve genel kazanım testleri için standart format.",
    optCount: 4,
    color: "from-blue-500 to-indigo-600",
  },
  {
    id: "yks_5",
    title: "YKS / TYT / AYT",
    badge: "5 Seçenek (A, B, C, D, E)",
    desc: "ÖSYM üniversiteye hazırlık ve lise deneme sınavı formatı.",
    optCount: 5,
    color: "from-purple-600 to-pink-600",
  },
  {
    id: "true_false",
    title: "Doğru / Yanlış",
    badge: "2 Seçenek (D / Y)",
    desc: "Hızlı kavram pekiştirme, doğru-yanlış taramaları ve çıkış biletleri.",
    optCount: 2,
    color: "from-emerald-500 to-teal-600",
  },
  {
    id: "primary_3",
    title: "İlkokul / Temel",
    badge: "3 Seçenek (A, B, C)",
    desc: "1-4. sınıf ilkokul seviyesi için pedagojik olarak sadeleştirilmiş format.",
    optCount: 3,
    color: "from-amber-500 to-orange-600",
  },
];
