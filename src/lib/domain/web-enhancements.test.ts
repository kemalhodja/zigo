import { describe, expect, it } from "vitest";

import {
  buildParentAnalyticsSummary,
  buildParentWhatsAppWeeklyReport,
} from "@/lib/domain/parent-analytics";
import type { ChildQuizActivityItem } from "@/lib/domain/parent-dashboard";
import { getClientIp } from "@/lib/server/client-ip";

describe("Web Enhancements & Zero Churn Features", () => {
  describe("getClientIp utility", () => {
    it("extracts the first IP from comma-separated x-forwarded-for header", () => {
      const req = new Request("https://zigo.app/api/quizzes", {
        headers: { "x-forwarded-for": "203.0.113.195, 70.41.3.18, 150.172.238.178" },
      });
      expect(getClientIp(req)).toBe("203.0.113.195");
    });

    it("falls back to x-real-ip when x-forwarded-for is missing", () => {
      const req = new Request("https://zigo.app/api/quizzes", {
        headers: { "x-real-ip": "198.51.100.42" },
      });
      expect(getClientIp(req)).toBe("198.51.100.42");
    });

    it("falls back to cf-connecting-ip when other headers are missing", () => {
      const req = new Request("https://zigo.app/api/quizzes", {
        headers: { "cf-connecting-ip": "192.0.2.1" },
      });
      expect(getClientIp(req)).toBe("192.0.2.1");
    });

    it("defaults to 127.0.0.1 when no proxy headers are present", () => {
      const req = new Request("https://zigo.app/api/quizzes");
      expect(getClientIp(req)).toBe("127.0.0.1");
    });
  });

  describe("WhatsApp Haftalık Veli Karnesi (buildParentWhatsAppWeeklyReport)", () => {
    it("generates encouragement report when child has no quiz attempts yet", () => {
      const emptySummary = buildParentAnalyticsSummary([]);
      const report = buildParentWhatsAppWeeklyReport("Ahmet", emptySummary, 120, "8", "https://zigo.app/parent/cockpit");

      expect(report).toContain("📊 *ZİGO HAFTALIK ÖĞRENCİ KARNESİ*");
      expect(report).toContain("👤 *Öğrenci:* Ahmet (8. Sınıf)");
      expect(report).toContain("✨ *Toplam Puan:* 120 Lig Puanı");
      expect(report).toContain("bu hafta henüz quiz tamamlamadı");
      expect(report).toContain("🔗 *Çalışma Paneli:* https://zigo.app/parent/cockpit");
    });

    it("generates detailed weekly report with accurate percentages and subjects", () => {
      const now = new Date("2026-10-14T12:00:00Z");
      const sampleActivity: ChildQuizActivityItem[] = [
        {
          attempt_id: "att-1",
          quiz_id: "q-mat",
          quiz_title: "LGS Matematik Denemesi",
          completed_at: "2026-10-13T10:00:00Z",
          total_questions: 10,
          correct_answers: 9,
          points_awarded: 90,
        },
        {
          attempt_id: "att-2",
          quiz_id: "q-fen",
          quiz_title: "Fen Bilimleri Canlılar",
          completed_at: "2026-10-12T15:00:00Z",
          total_questions: 10,
          correct_answers: 5,
          points_awarded: 50,
        },
      ];

      const summary = buildParentAnalyticsSummary(sampleActivity, now);
      const report = buildParentWhatsAppWeeklyReport(
        "Zeynep",
        summary,
        450,
        "7",
        "https://zigo.app/parent/cockpit?child=zeynep",
      );

      expect(report).toContain("👤 *Öğrenci:* Zeynep (7. Sınıf)");
      expect(report).toContain("✨ *Toplam Puan:* 450 Lig Puanı");
      expect(report).toContain("• Çözülen Toplam Soru: 20");
      expect(report).toContain("• Doğru Cevap: 14");
      expect(report).toContain("• Doğruluk Oranı: %70");
      expect(report).toContain("🌟 *En Başarılı Olduğu Konu:* LGS Matematik Denemesi (%90)");
      expect(report).toContain("🎯 *Destek Önerilen Konu:* Fen Bilimleri Canlılar (%50)");
      expect(report).toContain("🔗 *Detaylı Rapor:* https://zigo.app/parent/cockpit?child=zeynep");
    });
  });
});
