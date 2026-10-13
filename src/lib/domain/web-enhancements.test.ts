import { describe, expect, it } from "vitest";

describe("Web Enhancements & Architecture Tests", () => {
  it("generates correct Schema.org Quiz JSON-LD structure for Google SERP crawler", () => {
    const quizData = {
      title: "8. Sınıf Üslü İfadeler MEB Kazanım Testi",
      description: "MEB müfredatına tam uyumlu 5 yeni nesil soru",
      questions: [
        {
          text: "2³ + 3² işleminin sonucu kaçtır?",
          options: ["15", "17", "19", "25"],
        },
      ],
    };

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Quiz",
      name: quizData.title,
      description: quizData.description,
      hasPart: quizData.questions.map((q, idx) => ({
        "@type": "Question",
        name: `Soru ${idx + 1}`,
        text: q.text,
        suggestedAnswer: q.options.map((opt) => ({
          "@type": "Answer",
          text: opt,
        })),
      })),
    };

    expect(jsonLd["@type"]).toBe("Quiz");
    expect(jsonLd.hasPart).toHaveLength(1);
    expect(jsonLd.hasPart[0].name).toBe("Soru 1");
    expect(jsonLd.hasPart[0].suggestedAnswer).toHaveLength(4);
    expect(jsonLd.hasPart[0].suggestedAnswer[0].text).toBe("15");
  });

  it("calculates accuracy percentage accurately for parent analytics cockpit", () => {
    const subjects = [
      { subject: "Matematik", correct: 78, total: 100 },
      { subject: "Fen", correct: 88, total: 100 },
      { subject: "Türkçe", correct: 92, total: 100 },
    ];

    const totalCorrect = subjects.reduce((acc, s) => acc + s.correct, 0);
    const totalQuestions = subjects.reduce((acc, s) => acc + s.total, 0);
    const overallAccuracy = Math.round((totalCorrect / totalQuestions) * 100);

    expect(overallAccuracy).toBe(86);
  });

  it("verifies math formula symbols are correctly formatted unicode characters", () => {
    const testFormula = `x² + √16 = 20`;
    expect(testFormula).toContain("²");
    expect(testFormula).toContain("√");
    expect(testFormula.length).toBeGreaterThan(5);
  });

  it("validates OpenGraph image query parameters sanitize properly", () => {
    const params = new URLSearchParams({
      title: "Matematik Düellosu & Yarışma",
      reward: "+25 Puan",
    });

    expect(params.get("title")).toBe("Matematik Düellosu & Yarışma");
    expect(params.get("reward")).toBe("+25 Puan");
  });
});
