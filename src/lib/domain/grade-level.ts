import { z } from "zod";

import { resolveGradeCategory, type GradeCategoryKey } from "@/lib/domain/education-catalog";

export const GRADE_LEVEL_OPTIONS = [
  "1. Sınıf",
  "2. Sınıf",
  "3. Sınıf",
  "4. Sınıf",
  "5. Sınıf",
  "6. Sınıf",
  "7. Sınıf",
  "8. Sınıf",
  "9. Sınıf",
  "10. Sınıf",
  "11. Sınıf",
  "12. Sınıf",
  "YKS",
  "TYT",
  "AYT",
  "DGS",
  "ALES",
  "KPSS",
] as const;

export const INDIVIDUAL_GRADE_LEVEL_OPTIONS = [
  "Hepsi (Tüm Sınıflar)",
  "1. Sınıf",
  "2. Sınıf",
  "3. Sınıf",
  "4. Sınıf",
  "5. Sınıf",
  "6. Sınıf",
  "7. Sınıf",
  "8. Sınıf",
  "9. Sınıf",
  "10. Sınıf",
  "11. Sınıf",
  "12. Sınıf",
  "LGS Hazırlık",
  "YKS / TYT / AYT Hazırlık",
  "DGS / KPSS / ALES",
  "Okul Öncesi",
] as const;

export type GradeLevelOption = (typeof GRADE_LEVEL_OPTIONS)[number];

export const EXAM_GRADE_LEVELS = ["YKS", "TYT", "AYT", "DGS", "ALES", "KPSS"] as const;
export type ExamGradeLevel = (typeof EXAM_GRADE_LEVELS)[number];

export const gradeLevelSchema = z.enum(GRADE_LEVEL_OPTIONS);

export const updateGradeLevelSchema = z.object({
  gradeLevel: gradeLevelSchema,
});

export const updateChildGradeLevelSchema = z.object({
  childProfileId: z.string().uuid(),
  gradeLevel: gradeLevelSchema,
});

type AreaLike = {
  id: number;
  area_name: string;
  age_group: string | null;
};

export function parseGradeNumber(gradeLevel: string | null | undefined): number | null {
  if (!gradeLevel) return null;
  const match = gradeLevel.match(/(\d+)\s*\.\s*Sınıf/i);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

export function isAutoInterestGradeLevel(gradeLevel: string | null | undefined): boolean {
  return Boolean(gradeLevel?.trim());
}

export function requiresBranchSelection(_gradeLevel: string | null | undefined): boolean {
  return false;
}

export function interestCategoryForGradeLevel(
  gradeLevel: string | null | undefined,
): GradeCategoryKey | "exam" | null {
  const grade = parseGradeNumber(gradeLevel);
  if (grade !== null && grade >= 1 && grade <= 4) return "primary";
  if (grade !== null && grade >= 5 && grade <= 8) return "middle";
  if (grade !== null && grade >= 9 && grade <= 12) return "high";

  const normalized = gradeLevel?.trim().toLocaleUpperCase("tr-TR");
  if (
    normalized === "YKS" ||
    normalized === "TYT" ||
    normalized === "AYT" ||
    normalized === "DGS" ||
    normalized === "ALES" ||
    normalized === "KPSS"
  ) {
    return "exam";
  }

  return null;
}

function isOtherClassSpecificArea(areaName: string, selectedGrade: number, bandStart: number, bandEnd: number) {
  for (let grade = bandStart; grade <= bandEnd; grade += 1) {
    if (grade === selectedGrade) continue;
    if (new RegExp(`^${grade}\\.\\s*Sınıf`, "i").test(areaName)) {
      return true;
    }
  }
  return false;
}

/** Areas to auto-select for all grades (1-12 & exam tracks). */
export function resolveAutoInterestAreaIds<T extends AreaLike>(
  areas: T[],
  gradeLevel: string | null | undefined,
): number[] {
  if (!gradeLevel) return [];
  const grade = parseGradeNumber(gradeLevel);

  if (grade !== null && grade >= 1 && grade <= 12) {
    const category = grade <= 4 ? "primary" : grade <= 8 ? "middle" : "high";
    const bandStart = grade <= 4 ? 1 : grade <= 8 ? 5 : 9;
    const bandEnd = grade <= 4 ? 4 : grade <= 8 ? 8 : 12;

    return areas
      .filter((area) => {
        if (resolveGradeCategory(area.age_group) !== category) return false;
        if (isOtherClassSpecificArea(area.area_name, grade, bandStart, bandEnd)) return false;
        return true;
      })
      .map((area) => area.id);
  }

  return areas.map((area) => area.id).slice(0, 15);
}

/** Areas shown for manual branch selection (9-12 and exam tracks). */
export function filterAreasForGradeLevel<T extends AreaLike>(
  areas: T[],
  gradeLevel: string | null | undefined,
): T[] {
  if (!gradeLevel) return areas;

  const category = interestCategoryForGradeLevel(gradeLevel);
  if (category === "primary" || category === "middle") {
    return areas.filter((area) => resolveGradeCategory(area.age_group) === category);
  }

  if (category === "high") {
    const grade = parseGradeNumber(gradeLevel);
    return areas.filter((area) => {
      if (resolveGradeCategory(area.age_group) !== "high") return false;
      if (grade === null) return true;
      return !isOtherClassSpecificArea(area.area_name, grade, 9, 12);
    });
  }

  if (category === "exam") {
    const exam = gradeLevel.trim().toLocaleUpperCase("tr-TR");
    return areas.filter((area) => {
      const age = (area.age_group ?? "").toLocaleUpperCase("tr-TR");
      const name = area.area_name.toLocaleUpperCase("tr-TR");
      if (age === exam || age.includes(exam) || name.includes(exam)) return true;
      // YKS track also surfaces shared 9-12 academic areas
      if (exam === "YKS" && resolveGradeCategory(area.age_group) === "high") return true;
      if ((exam === "TYT" || exam === "AYT") && resolveGradeCategory(area.age_group) === "high") {
        return name.includes("YKS") || name.includes(exam) || age.includes("9-12");
      }
      return false;
    });
  }

  return areas;
}
