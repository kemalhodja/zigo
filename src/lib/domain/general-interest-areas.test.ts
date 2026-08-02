import { describe, expect, it } from "vitest";

import { resolveGradeCategory } from "@/lib/domain/education-catalog";
import {
  filterAreasForInterestSelection,
  isGeneralInterestArea,
  isTeacherGeneralInterestSelection,
  GENERAL_INTEREST_EXPERTISE_AREAS,
} from "@/lib/domain/general-interest-areas";

describe("general interest areas", () => {
  const general = { id: 1, age_group: "Genel İlgi" };
  const math = { id: 2, age_group: "5-8. Sınıf" };

  it("detects general interest age group", () => {
    expect(resolveGradeCategory("Genel İlgi")).toBe("generalInterest");
    expect(isGeneralInterestArea(general)).toBe(true);
    expect(isGeneralInterestArea(math)).toBe(false);
  });

  it("allows teachers, parents, and students to select academic and general interest areas", () => {
    expect(filterAreasForInterestSelection([general, math], "teacher")).toEqual([general, math]);
    expect(filterAreasForInterestSelection([general, math], "student")).toEqual([general, math]);
  });

  it("requires exactly one general interest for teachers", () => {
    expect(isTeacherGeneralInterestSelection([general])).toBe(true);
    expect(isTeacherGeneralInterestSelection([general, general])).toBe(false);
    expect(isTeacherGeneralInterestSelection([math])).toBe(false);
  });

  it("ships an expanded expertise matrix for teachers", () => {
    expect(GENERAL_INTEREST_EXPERTISE_AREAS.length).toBeGreaterThanOrEqual(40);
    expect(GENERAL_INTEREST_EXPERTISE_AREAS).toContain("Yapay Zeka");
    expect(GENERAL_INTEREST_EXPERTISE_AREAS).toContain("Eğitim ve Pedagoji");
    expect(GENERAL_INTEREST_EXPERTISE_AREAS).toContain("Satranç");
  });
});
