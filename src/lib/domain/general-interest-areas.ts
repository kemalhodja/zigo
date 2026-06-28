import { type GradeCategoryKey, resolveGradeCategory } from "@/lib/domain/education-catalog";
import { isPublisherRole } from "@/lib/domain/role-utils";
import type { UserRole } from "@/lib/supabase/database.types";

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
  role: UserRole,
): T[] {
  if (role === "student" || role === "parent") {
    return areas;
  }

  if (isPublisherRole(role)) {
    return areas.filter(isGeneralInterestArea);
  }

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
