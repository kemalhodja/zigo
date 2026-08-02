import { describe, expect, it } from "vitest";

import { displayEducationAreaName } from "@/lib/domain/education-catalog";

describe("displayEducationAreaName", () => {
  it("strips exam and grade band prefixes", () => {
    expect(displayEducationAreaName("TYT Matematik")).toBe("Matematik");
    expect(displayEducationAreaName("AYT Fizik")).toBe("Fizik");
    expect(displayEducationAreaName("LGS Fen Bilimleri")).toBe("Fen Bilimleri");
    expect(displayEducationAreaName("YKS Genel Hazırlık")).toBe("Genel Hazırlık");
    expect(displayEducationAreaName("5-8. Sınıf İngilizce")).toBe("İngilizce");
    expect(displayEducationAreaName("1. Sınıf Matematik")).toBe("Matematik");
    expect(displayEducationAreaName("İlkokul Okuma-Yazma")).toBe("Okuma-Yazma");
  });

  it("keeps plain subject names unchanged", () => {
    expect(displayEducationAreaName("Kodlama ve Algoritma")).toBe("Kodlama ve Algoritma");
    expect(displayEducationAreaName("Ebeveyn Rehberliği")).toBe("Ebeveyn Rehberliği");
  });
});
