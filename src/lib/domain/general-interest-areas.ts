import { type GradeCategoryKey,resolveGradeCategory } from "@/lib/domain/education-catalog";

export const GENERAL_INTEREST_AGE_GROUP = "Genel İlgi";

type AreaLike = {
  id: number;
  age_group: string | null;
};

export function isGeneralInterestArea(area: Pick<AreaLike, "age_group">) {
  return resolveGradeCategory(area.age_group) === "generalInterest";
}

/** Öğrenci/veli: tüm alanlar. Öğretmen/kurum: yalnızca Genel İlgi niş kategorileri. */
export function filterAreasForInterestSelection<T extends AreaLike>(
  areas: T[],
  role: "teacher" | "parent" | "student",
): T[] {
  if (role === "student" || role === "parent") {
    return areas;
  }

  return areas.filter(isGeneralInterestArea);
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
