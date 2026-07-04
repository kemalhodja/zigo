import { describe, expect, it } from "vitest";

import { resolveGradeCategory } from "@/lib/domain/education-catalog";
import {
  filterAreasForInterestSelection,
  isGeneralInterestArea,
  isTeacherGeneralInterestSelection,
} from "@/lib/domain/general-interest-areas";

describe("general interest areas", () => {
  const general = { id: 1, age_group: "Genel İlgi" };
  const math = { id: 2, age_group: "5-8. Sınıf" };

  it("detects general interest age group", () => {
    expect(resolveGradeCategory("Genel İlgi")).toBe("generalInterest");
    expect(isGeneralInterestArea(general)).toBe(true);
    expect(isGeneralInterestArea(math)).toBe(false);
  });

  it("filters teacher areas to general interest only", () => {
    expect(filterAreasForInterestSelection([general, math], "teacher")).toEqual([general]);
    expect(filterAreasForInterestSelection([general, math], "student")).toEqual([general, math]);
  });

  it("requires exactly one general interest for teachers", () => {
    expect(isTeacherGeneralInterestSelection([general])).toBe(true);
    expect(isTeacherGeneralInterestSelection([general, general])).toBe(false);
    expect(isTeacherGeneralInterestSelection([math])).toBe(false);
  });
});
