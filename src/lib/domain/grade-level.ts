import { z } from "zod";

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
  "Veli",
] as const;

export const gradeLevelSchema = z.enum(GRADE_LEVEL_OPTIONS);

export const updateGradeLevelSchema = z.object({
  gradeLevel: gradeLevelSchema,
});

export const updateChildGradeLevelSchema = z.object({
  childProfileId: z.string().uuid(),
  gradeLevel: gradeLevelSchema,
});
