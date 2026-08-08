import { describe, expect, it } from "vitest";

import {
  filterAreasForGradeLevel,
  GRADE_LEVEL_OPTIONS,
  isAutoInterestGradeLevel,
  parseGradeNumber,
  requiresBranchSelection,
  resolveAutoInterestAreaIds,
} from "@/lib/domain/grade-level";

const areas = [
  { id: 1, area_name: "1. Sınıf Matematik", age_group: "1-4. Sınıf" },
  { id: 2, area_name: "2. Sınıf Matematik", age_group: "1-4. Sınıf" },
  { id: 3, area_name: "1-4. Sınıf Türkçe", age_group: "1-4. Sınıf" },
  { id: 4, area_name: "5. Sınıf Matematik", age_group: "5-8. Sınıf" },
  { id: 5, area_name: "6. Sınıf Matematik", age_group: "5-8. Sınıf" },
  { id: 6, area_name: "5-8. Sınıf İngilizce", age_group: "5-8. Sınıf" },
  { id: 7, area_name: "YKS Matematik", age_group: "9-12. Sınıf" },
  { id: 8, area_name: "TYT Türkçe", age_group: "TYT" },
  { id: 9, area_name: "KPSS Genel Yetenek", age_group: "KPSS" },
];

describe("grade-level", () => {
  it("lists individual classes and exam tracks without band labels", () => {
    expect(GRADE_LEVEL_OPTIONS).toContain("1. Sınıf");
    expect(GRADE_LEVEL_OPTIONS).toContain("8. Sınıf");
    expect(GRADE_LEVEL_OPTIONS).toContain("YKS");
    expect(GRADE_LEVEL_OPTIONS).toContain("TYT");
    expect(GRADE_LEVEL_OPTIONS).toContain("AYT");
    expect(GRADE_LEVEL_OPTIONS).toContain("DGS");
    expect(GRADE_LEVEL_OPTIONS).toContain("ALES");
    expect(GRADE_LEVEL_OPTIONS).toContain("KPSS");
    expect(GRADE_LEVEL_OPTIONS).not.toContain("Veli");
    expect(GRADE_LEVEL_OPTIONS.some((item) => item.includes("1-4"))).toBe(false);
  });

  it("detects auto-interest grades for all valid grade levels", () => {
    expect(isAutoInterestGradeLevel("1. Sınıf")).toBe(true);
    expect(isAutoInterestGradeLevel("8. Sınıf")).toBe(true);
    expect(isAutoInterestGradeLevel("9. Sınıf")).toBe(true);
    expect(isAutoInterestGradeLevel("YKS")).toBe(true);
    expect(parseGradeNumber("5. Sınıf")).toBe(5);
  });

  it("disables manual branch selection requirement across grade levels", () => {
    expect(requiresBranchSelection("5. Sınıf")).toBe(false);
    expect(requiresBranchSelection("10. Sınıf")).toBe(false);
    expect(requiresBranchSelection("AYT")).toBe(false);
  });

  it("auto-selects band subjects and skips other class-specific rows", () => {
    expect(resolveAutoInterestAreaIds(areas, "1. Sınıf").sort()).toEqual([1, 3]);
    expect(resolveAutoInterestAreaIds(areas, "5. Sınıf").sort()).toEqual([4, 6]);
  });

  it("filters exam and high-school branch lists", () => {
    expect(filterAreasForGradeLevel(areas, "TYT").map((area) => area.id)).toEqual([7, 8]);
    expect(filterAreasForGradeLevel(areas, "KPSS").map((area) => area.id)).toEqual([9]);
  });
});
